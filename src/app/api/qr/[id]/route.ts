import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const patch: Record<string, unknown> = {};
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (body.valid_until) patch.valid_until = body.valid_until;
  if (typeof body.title === "string") patch.title = body.title;
  if (!Object.keys(patch).length)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const supabase = await createClient(); // RLS: app users allowed
  const { error } = await supabase.from("qr_codes").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const admin = createAdminClient();
  const { data: row } = await admin.from("qr_codes").select("file_path").eq("id", id).single();
  if (row?.file_path) await admin.storage.from("qr-files").remove([row.file_path]);
  const { error } = await admin.from("qr_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
