import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string; email: string; full_name: string | null;
  role: "admin" | "manager"; is_active: boolean;
};

// Returns the current user's profile or null. Use in server components /
// route handlers to gate access.
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", user.id)
    .single();
  if (!data || !data.is_active) return null;
  return data as Profile;
}
