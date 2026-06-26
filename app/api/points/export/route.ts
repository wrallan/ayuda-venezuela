import * as XLSX from "xlsx";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/auth/session";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puntos_ayuda")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: "No se pudieron exportar los puntos." }, { status: 500 });
  }

  const filas = (data ?? []).map((p) => ({
    id: p.id,
    tipo: p.tipo,
    titulo: p.titulo,
    descripcion: p.descripcion ?? "",
    zona: p.zona,
    estado_severidad: p.estado_severidad,
    ayuda_qty: p.ayuda_qty,
    lat: p.lat,
    lng: p.lng,
    creado_por: p.creado_por,
    creado_en: p.created_at,
  }));

  const worksheet = XLSX.utils.json_to_sheet(filas);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Puntos de Ayuda");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="puntos_ayuda_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
