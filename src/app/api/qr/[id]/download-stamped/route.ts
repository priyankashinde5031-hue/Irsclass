import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stampedFileName } from "@/lib/qr";

// Mints a fresh, download-disposition signed URL for the QR-stamped copy of
// a PDF. Signed URLs expire (SIGNED_URL_TTL), so this is minted on demand
// rather than stored — same reason the public /q/[slug] viewer mints one
// per scan instead of caching it.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const admin = createAdminClient();
  const { data: qr, error } = await admin
    .from("qr_codes")
    .select("title,slug,file_type,stamped_file_path")
    .eq("id", id)
    .single();

  if (error || !qr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (qr.file_type !== "pdf" || !qr.stamped_file_path)
    return NextResponse.json({ error: "No stamped file available for this QR" }, { status: 404 });

  const ttl = Number(process.env.SIGNED_URL_TTL || 3600);
  const filename = stampedFileName(qr.title, qr.slug);
  const { data: signed, error: signErr } = await admin.storage
    .from("qr-files")
    .createSignedUrl(qr.stamped_file_path, ttl, { download: filename });

  if (signErr || !signed?.signedUrl)
    return NextResponse.json({ error: "Couldn't create download link" }, { status: 500 });

  return NextResponse.json({ url: signed.signedUrl });
}
