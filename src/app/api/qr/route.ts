import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const title = (form.get("title") as string)?.trim();
  const description = (form.get("description") as string) || null;
  const validUntilRaw = form.get("valid_until") as string | null; // YYYY-MM-DD, optional
  const validUntil = validUntilRaw?.trim() || null; // null = never expires

  if (!file || !title)
    return NextResponse.json({ error: "file and title are required" }, { status: 400 });

  const mime = file.type;
  const isPdf = mime === "application/pdf";
  const isImg = mime.startsWith("image/");
  if (!isPdf && !isImg)
    return NextResponse.json({ error: "Only images and PDFs are allowed" }, { status: 400 });

  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File exceeds the 5 MB limit" }, { status: 400 });

  const admin = createAdminClient();
  const slug = nanoid(12);
  const ext = file.name.split(".").pop() || (isPdf ? "pdf" : "bin");
  const path = `${slug}/${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const up = await admin.storage.from("qr-files").upload(path, bytes, { contentType: mime });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  const { data, error } = await admin.from("qr_codes").insert({
    slug, title, description,
    file_path: path, file_name: file.name,
    file_type: isPdf ? "pdf" : "image",
    mime_type: mime, file_size: bytes.length,
    valid_until: validUntil, created_by: profile.id,
  }).select("id,slug").single();

  if (error) {
    await admin.storage.from("qr-files").remove([path]); // rollback file
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, slug: data.slug });
}
