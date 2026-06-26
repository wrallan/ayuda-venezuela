import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para el navegador.
 * Usa la clave "anon", la cual respeta las políticas de RLS definidas en
 * supabase/schema.sql: solo puede LEER puntos_ayuda e INSERTAR en
 * reportes_ciudadanos. No puede escribir puntos ni leer reportes ajenos,
 * sin importar qué código corra en el cliente — la regla vive en la base
 * de datos, no en el frontend.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
