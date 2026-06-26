import { getAdminSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getAdminSession();
  return Response.json({ authenticated: !!session, username: session?.sub ?? null });
}
