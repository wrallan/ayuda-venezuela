import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/AyudaJ");
  }
  return <>{children}</>;
}
