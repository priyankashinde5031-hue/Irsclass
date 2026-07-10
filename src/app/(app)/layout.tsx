import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile.role} email={profile.email} />
      <main className="flex-1 min-w-0 p-5 md:p-10 pt-20 md:pt-10">
        <div className="mx-auto max-w-6xl animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
