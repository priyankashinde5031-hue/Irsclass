import { createClient } from "@supabase/supabase-js";

// Service-role client. SERVER ONLY. Bypasses RLS. Use for: user
// creation/reset, public viewer lookups, storage signed URLs, cron.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
