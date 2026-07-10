import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin")
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles")
    .select("id,email,full_name,role,is_active,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin")
    return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { email, password, full_name, role } = await req.json();
  if (!email || !password || !["admin", "manager"].includes(role))
    return NextResponse.json({ error: "email, password and a valid role are required" }, { status: 400 });

  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (created.error) return NextResponse.json({ error: created.error.message }, { status: 400 });

  const { error } = await admin.from("profiles").insert({
    id: created.data.user!.id, email, full_name: full_name || null,
    role, created_by: profile.id,
  });
  if (error) {
    await admin.auth.admin.deleteUser(created.data.user!.id); // rollback
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: created.data.user!.id });
}
