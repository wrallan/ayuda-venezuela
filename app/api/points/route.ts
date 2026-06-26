import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { puntoAyudaSchema } from "@/lib/validation/schemas";
import { requireAdminSession } from "@/lib/auth/session";

/**
 * GET /api/points
 * Público: cualquier visitante puede leer todos los puntos del mapa.
 * No requiere sesión porque el mapa público es, por diseño, abierto.
 */
export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puntos_ayuda")
    .select("id, tipo, titulo, descripcion, zona, estado_severidad, ayuda_qty, lat, lng, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "No se pudieron cargar los puntos." }, { status: 500 });
  }

  return Response.json({ points: data });
}

/**
 * POST /api/points
 * Protegido: solo admin con sesión válida puede crear puntos.
 * Todos los valores se validan con Zod antes de tocar la base de datos,
 * y se insertan vía el cliente oficial de Supabase con columnas
 * tipadas (nunca SQL armado a partir de strings), lo que elimina por
 * diseño el riesgo de inyección SQL en este endpoint.
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

  const parsed = puntoAyudaSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Datos inválidos.", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puntos_ayuda")
    .insert({
      tipo: parsed.data.tipo,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      zona: parsed.data.zona,
      estado_severidad: parsed.data.estado_severidad,
      ayuda_qty: parsed.data.ayuda_qty,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      reporte_origen_id: parsed.data.reporte_origen_id ?? null,
      creado_por: auth.session.sub,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "No se pudo crear el punto." }, { status: 500 });
  }

  return Response.json({ point: data }, { status: 201 });
}
