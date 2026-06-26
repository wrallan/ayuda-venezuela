import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { puntoAyudaSchema } from "@/lib/validation/schemas";
import { requireAdminSession } from "@/lib/auth/session";
import { z } from "zod";

const idSchema = z.string().uuid();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const idCheck = idSchema.safeParse(params.id);
  if (!idCheck.success) {
    return Response.json({ error: "ID de punto inválido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const parsed = puntoAyudaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Datos inválidos.", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("puntos_ayuda")
    .update(parsed.data)
    .eq("id", idCheck.data)
    .select()
    .maybeSingle();

  if (error) {
    return Response.json({ error: "No se pudo actualizar el punto." }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Punto no encontrado." }, { status: 404 });
  }

  return Response.json({ point: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const idCheck = idSchema.safeParse(params.id);
  if (!idCheck.success) {
    return Response.json({ error: "ID de punto inválido." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("puntos_ayuda").delete().eq("id", idCheck.data);

  if (error) {
    return Response.json({ error: "No se pudo eliminar el punto." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
