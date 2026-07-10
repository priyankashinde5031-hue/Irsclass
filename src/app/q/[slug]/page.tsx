import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic"; // never cache a scan result

// PUBLIC, UNAUTHENTICATED viewer. This is the URL encoded in every QR.
// It stays STABLE for the life of the QR. On each scan we:
//   1. look up the row by slug (service role, single row only)
//   2. enforce is_active AND current_date <= valid_until
//   3. log the scan
//   4. mint a short-lived (SIGNED_URL_TTL, default 1h) signed URL
//   5. render the image/PDF inline
export default async function ViewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const h = await headers();

  const { data: qr } = await admin
    .from("qr_codes")
    .select("id,file_path,file_type,mime_type,is_active,valid_until,title")
    .eq("slug", slug)
    .single();

  if (!qr) return <Notice title="Not found" body="This QR code doesn't exist." />;

  const today = new Date().toISOString().slice(0, 10);
  const expired = qr.valid_until < today;
  const available = qr.is_active && !expired;

  await admin.rpc("register_scan", {
    p_qr: qr.id, p_served: available,
    p_ua: h.get("user-agent"), p_ref: h.get("referer"),
  });

  if (!available) {
    return (
      <Notice
        title={expired ? "This QR has expired" : "This QR is not active"}
        body="The document is no longer available. Please contact the sender."
      />
    );
  }

  const ttl = Number(process.env.SIGNED_URL_TTL || 3600);
  const { data: signed } = await admin.storage
    .from("qr-files")
    .createSignedUrl(qr.file_path, ttl);

  if (!signed?.signedUrl)
    return <Notice title="Unavailable" body="Could not load the document. Try again shortly." />;

  return (
    <main className="min-h-screen bg-gray-100">
      {qr.file_type === "pdf" ? (
        <iframe src={signed.signedUrl} title={qr.title} className="w-screen h-screen border-0" />
      ) : (
        <div className="min-h-screen grid place-items-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signed.signedUrl} alt={qr.title} className="max-w-full max-h-screen object-contain" />
        </div>
      )}
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen grid place-items-center p-6 text-center">
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-gray-500">{body}</p>
      </div>
    </main>
  );
}
