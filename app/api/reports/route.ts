import { NextRequest } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reporteCiudadanoSchema, filtroReportesSchema } from "@/lib/validation/schemas";
import { requireAdminSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

/**
 * POST /api/reports
 * Público: cualquier persona puede reportar un caso. Limitado por IP
 * para mitigar spam/saturación (4 envíos cada 10 minutos por IP).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`report:${ip}`, 4, 10 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Has enviado demasiados reportes. Espera unos minutos e intenta de nuevo." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const parsed = reporteCiudadanoSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Revisa los datos del formulario.", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reportes_ciudadanos")
    .insert({
      nombre_contacto: parsed.data.nombre_contacto,
      telefono: parsed.data.telefono,
      cedula: parsed.data.cedula,
      zona_afectada: parsed.data.zona_afectada,
      tipo_ayuda_solicitada: parsed.data.tipo_ayuda_solicitada,
      descripcion: parsed.data.descripcion,
      personas_afectadas: parsed.data.personas_afectadas ?? null,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      ip_hash: ipHash,
    })
    .select("id, created_at")
    .single();

  if (error) {
    return Response.json({ error: "No se pudo registrar el reporte." }, { status: 500 });
  }

  return Response.json({ ok: true, id: data.id }, { status: 201 });
}

/**
 * GET /api/reports
 * Protegido: solo admin. Soporta filtros por zona/estado/tipo/fechas vía
 * query params, que luego alimentan tanto la tabla del panel como la
 * exportación a Excel filtrada.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const filtro = filtroReportesSchema.safeParse({
    zona: url.searchParams.get("zona") ?? undefined,
    estado: url.searchParams.get("estado") ?? undefined,
    tipo: url.searchParams.get("tipo") ?? undefined,
    desde: url.searchParams.get("desde") ?? undefined,
    hasta: url.searchParams.get("hasta") ?? undefined,
  });

  if (!filtro.success) {
    return Response.json({ error: "Filtros inválidos." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase.from("reportes_ciudadanos").select("*").order("created_at", { ascending: false });

  if (filtro.data.zona) {
    // Escapamos los wildcards propios de LIKE/ILIKE (% y _) para que un
    // usuario que escriba esos caracteres no altere el patrón de búsqueda.
    // Supabase ya parametriza el valor (no hay concatenación SQL), esto
    // es además una capa de corrección semántica.
    const zonaEscapada = filtro.data.zona.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.ilike("zona_afectada", `%${zonaEscapada}%`);
  }
  if (filtro.data.estado !== "todos") query = query.eq("estado", filtro.data.estado);
  if (filtro.data.tipo !== "todos") query = query.eq("tipo_ayuda_solicitada", filtro.data.tipo);
  if (filtro.data.desde) query = query.gte("created_at", filtro.data.desde);
  if (filtro.data.hasta) query = query.lte("created_at", filtro.data.hasta);

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: "No se pudieron cargar los reportes." }, { status: 500 });
  }

  return Response.json({ reports: data });
}
