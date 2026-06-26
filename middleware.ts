import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware global: añade cabeceras de seguridad HTTP estándar a toda
 * respuesta. La protección real de rutas (sesión admin) ocurre en
 * lib/auth/session.ts dentro de cada ruta de API y en
 * app/AyudaJ/dashboard/layout.tsx; este middleware es una capa adicional
 * de buenas prácticas (defensa en profundidad), no el único control.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");

  return response;
}

export const config = {
  matcher: "/:path*",
};
