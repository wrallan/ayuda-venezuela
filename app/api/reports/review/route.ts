import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revisionReporteSchema } from "@/lib/validation/schemas";
import { requireAdminSession } from "@/lib/auth/session";

/**
 * POST /api/reports/review
 * Protegido: solo admin. Tres acciones posibles sobre un reporte:
 *  - aprobar: marca el reporte como aprobado (sin crear punto todavía)
 *  - rechazar: marca el reporte como rechazado (no se publica nunca)
 *  - convertir: crea un punto real en el mapa a partir del reporte,
 *               y marca el reporte como "convertido"
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const parsed = revisionReporteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Datos inválidos.", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { reporte_id, accion, notas_admin } = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data: reporte, error: fetchError } = await supabase
    .from("reportes_ciudadanos")
    .select("*")
    .eq("id", reporte_id)
    .maybeSingle();

  if (fetchError || !reporte) {
    return Response.json({ error: "Reporte no encontrado." }, { status: 404 });
  }

  if (accion === "rechazar") {
    const { error } = await supabase
      .from("reportes_ciudadanos")
      .update({ estado: "rechazado", notas_admin: notas_admin || null, revisado_at: new Date().toISOString() })
      .eq("id", reporte_id);
    if (error) return Response.json({ error: "No se pudo rechazar el reporte." }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (accion === "aprobar") {
    const { error } = await supabase
      .from("reportes_ciudadanos")
      .update({ estado: "aprobado", notas_admin: notas_admin || null, revisado_at: new Date().toISOString() })
      .eq("id", reporte_id);
    if (error) return Response.json({ error: "No se pudo aprobar el reporte." }, { status: 500 });
    return Response.json({ ok: true });
  }

  // accion === "convertir": requiere coordenadas válidas (las del
  // reporte si las tiene, o las que el admin haya ajustado al convertir)
  const lat = parsed.data.lat ?? reporte.lat;
  const lng = parsed.data.lng ?? reporte.lng;

  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    return Response.json(
      { error: "El reporte no tiene coordenadas. Indica lat/lng para convertirlo en punto." },
      { status: 400 }
    );
  }

  const { data: nuevoPunto, error: insertError } = await supabase
    .from("puntos_ayuda")
    .insert({
      tipo: parsed.data.tipo ?? reporte.tipo_ayuda_solicitada,
      titulo: `Caso reportado: ${reporte.zona_afectada}`,
      descripcion: reporte.descripcion,
      zona: reporte.zona_afectada,
      estado_severidad: parsed.data.estado_severidad ?? "critico",
      ayuda_qty: parsed.data.ayuda_qty ?? reporte.personas_afectadas ?? 0,
      lat,
      lng,
      reporte_origen_id: reporte.id,
      creado_por: auth.session.sub,
    })
    .select()
    .single();

  if (insertError) {
    return Response.json({ error: "No se pudo crear el punto desde el reporte." }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("reportes_ciudadanos")
    .update({ estado: "convertido", notas_admin: notas_admin || null, revisado_at: new Date().toISOString() })
    .eq("id", reporte_id);

  if (updateError) {
    return Response.json(
      { error: "El punto se creó pero no se pudo actualizar el estado del reporte." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, point: nuevoPunto });
}
