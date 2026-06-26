import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/schemas";
import { createAdminSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  // Máximo 8 intentos por IP cada 10 minutos contra el endpoint de login.
  const rl = checkRateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Usuario o contraseña inválidos." }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const supabase = createSupabaseAdminClient();
  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("username, password_hash")
    .eq("username", username)
    .maybeSingle();

  // Respuesta deliberadamente idéntica si el usuario no existe o la
  // contraseña no coincide, para no filtrar cuáles usuarios existen.
  if (error || !adminUser) {
    await bcrypt.compare(password, "$2a$10$invalidsaltinvalidsaltinvalidsa");
    return Response.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, adminUser.password_hash);
  if (!passwordMatches) {
    return Response.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  await createAdminSession(adminUser.username);

  return Response.json({ ok: true });
}
