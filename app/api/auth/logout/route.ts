import { destroyAdminSession } from "@/lib/auth/session";

export async function POST() {
  await destroyAdminSession();
  return Response.json({ ok: true });
}
