import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la SERVICE ROLE KEY.
 *
 * ADVERTENCIA DE SEGURIDAD: este cliente ignora (bypassea) todas las
 * políticas de RLS. Por eso:
 *   1. El import "server-only" hace que el build falle si este archivo
 *      llegara a importarse desde código de cliente (navegador).
 *   2. SUPABASE_SERVICE_ROLE_KEY nunca debe tener el prefijo NEXT_PUBLIC_
 *      ni exponerse en ningún componente cliente.
 *   3. Solo se usa dentro de app/api/** después de verificar la sesión
 *      de admin con requireAdminSession().
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
