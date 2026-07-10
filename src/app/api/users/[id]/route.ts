import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin")
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { id } = await params;
  const { password, role, is_active } = await req.json();

  // Guard against an admin locking themselves out.
  if (id === profile.id) {
    if (is_active === false)
      return NextResponse.json({ error: "You can’t disable your own account." }, { status: 400 });
    if (role === "manager")
      return NextResponse.json({ error: "You can’t remove your own admin role." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Admin explicitly sets/regenerates the password of their choosing.
  if (password) {
    const r = await admin.auth.admin.updateUserById(id, { password });
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (role && ["admin", "manager"].includes(role)) patch.role = role;
  if (typeof is_active === "boolean") patch.is_active = is_active;
  if (Object.keys(patch).length) {
    const r = await admin.from("profiles").update(patch).eq("id", id);
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
