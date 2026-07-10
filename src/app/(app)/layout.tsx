import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile.role} email={profile.email} />
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8">{children}</main>
    </div>
  );
}
