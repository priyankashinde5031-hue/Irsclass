import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

// Server-side guard: only admins may reach /users, even by typing the URL.
export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/generate");
  return <>{children}</>;
}
