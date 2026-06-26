import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "ayudaj_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 2; // 2 horas

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET debe estar definido en las variables de entorno y tener al menos 32 caracteres."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSessionPayload {
  sub: string; // username del admin
  role: "admin";
}

/**
 * Crea un JWT firmado y lo guarda en una cookie httpOnly, secure, sameSite.
 * No es accesible desde JavaScript del navegador (mitiga XSS) y se valida
 * en el servidor en cada request a una ruta protegida.
 */
export async function createAdminSession(username: string) {
  const secretKey = getSecretKey();
  const token = await new SignJWT({ role: "admin" } satisfies Partial<AdminSessionPayload>)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Verifica la sesión actual. Devuelve el payload si es válida, o null si
 * no existe, expiró, o la firma no coincide (cookie falsificada).
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    if (payload.role !== "admin" || typeof payload.sub !== "string") return null;
    return { sub: payload.sub, role: "admin" };
  } catch {
    return null;
  }
}

/**
 * Helper para usar al inicio de cualquier ruta de API protegida.
 * Lanza un Response 401 listo para devolver si no hay sesión válida.
 */
export async function requireAdminSession(): Promise<
  { ok: true; session: AdminSessionPayload } | { ok: false; response: Response }
> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: Response.json(
        { error: "No autorizado. Inicia sesión nuevamente." },
        { status: 401 }
      ),
    };
  }
  return { ok: true, session };
}
