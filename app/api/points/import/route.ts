import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/auth/session";
import { puntoAyudaSchema } from "@/lib/validation/schemas";
import { z } from "zod";

/**
 * POST /api/points/import
 * Permite restaurar puntos desde un archivo .xlsx exportado previamente
 * (ver /api/points/export), para no perder el trabajo mientras el sistema
 * sigue en desarrollo, tal como se pidió. Cada fila se valida con el mismo
 * esquema Zod que usa la creación manual — ninguna fila "se cuela" sin
 * pasar por validación, incluso viniendo de un archivo.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(sheet);
  } catch {
    return Response.json({ error: "El archivo no es un Excel válido." }, { status: 400 });
  }

  const rowSchema = puntoAyudaSchema.extend({
    titulo: puntoAyudaSchema.shape.titulo,
  });

  const validRows: z.infer<typeof rowSchema>[] = [];
  const errores: { fila: number; error: string }[] = [];

  rows.forEach((row, idx) => {
    const parsed = rowSchema.safeParse(row);
    if (parsed.success) {
      validRows.push(parsed.data);
    } else {
      errores.push({ fila: idx + 2, error: parsed.error.issues.map((i) => i.message).join("; ") });
    }
  });

  if (validRows.length === 0) {
    return Response.json(
      { error: "Ninguna fila pasó la validación.", detalles: errores },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puntos_ayuda")
    .insert(
      validRows.map((r) => ({
        tipo: r.tipo,
        titulo: r.titulo,
        descripcion: r.descripcion || null,
        zona: r.zona,
        estado_severidad: r.estado_severidad,
        ayuda_qty: r.ayuda_qty,
        lat: r.lat,
        lng: r.lng,
        creado_por: auth.session.sub,
      }))
    )
    .select();

  if (error) {
    return Response.json({ error: "No se pudieron insertar los puntos." }, { status: 500 });
  }

  return Response.json({
    importados: data?.length ?? 0,
    omitidos: errores.length,
    erroresDetalle: errores,
  });
}
