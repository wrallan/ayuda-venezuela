import "server-only";

/**
 * Rate limiter simple en memoria (ventana fija). Suficiente para una sola
 * instancia de Vercel en funciones serverless de corta duración; no es
 * un sustituto de un WAF, pero frena intentos automatizados básicos de
 * fuerza bruta contra /api/auth/login y de spam contra /api/reports.
 *
 * Nota: en Vercel cada función serverless puede tener su propia memoria,
 * por lo que esto es una mitigación de "mejor esfuerzo", no una garantía
 * absoluta. Para garantías estrictas se recomendaría Upstash Redis,
 * pero esto cubre el caso de uso actual sin dependencias externas extra.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Limpieza periódica para no acumular memoria indefinidamente
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000);

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
