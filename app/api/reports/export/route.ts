import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/auth/session";
import { filtroReportesSchema } from "@/lib/validation/schemas";

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
    const zonaEscapada = filtro.data.zona.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.ilike("zona_afectada", `%${zonaEscapada}%`);
  }
  if (filtro.data.estado !== "todos") query = query.eq("estado", filtro.data.estado);
  if (filtro.data.tipo !== "todos") query = query.eq("tipo_ayuda_solicitada", filtro.data.tipo);
  if (filtro.data.desde) query = query.gte("created_at", filtro.data.desde);
  if (filtro.data.hasta) query = query.lte("created_at", filtro.data.hasta);

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: "No se pudieron exportar los reportes." }, { status: 500 });
  }

  const filas = (data ?? []).map((r) => ({
    id: r.id,
    nombre_contacto: r.nombre_contacto,
    telefono: r.telefono,
    cedula: r.cedula,
    zona_afectada: r.zona_afectada,
    tipo_ayuda_solicitada: r.tipo_ayuda_solicitada,
    descripcion: r.descripcion,
    personas_afectadas: r.personas_afectadas,
    lat: r.lat,
    lng: r.lng,
    estado: r.estado,
    notas_admin: r.notas_admin ?? "",
    creado_en: r.created_at,
    revisado_en: r.revisado_at ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(filas);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes Ciudadanos");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reportes_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
