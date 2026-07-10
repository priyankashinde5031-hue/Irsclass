import type { ReactNode } from "react";
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
    .select("id,file_path,file_type,mime_type,is_active,valid_until,title,description")
    .eq("slug", slug)
    .single();

  if (!qr) return <Notice variant="notfound" title="QR not found" body="This QR code doesn’t exist or has been removed." />;

  const today = new Date().toISOString().slice(0, 10);
  const expired = qr.valid_until < today;
  const available = qr.is_active && !expired;

  await admin.rpc("register_scan", {
    p_qr: qr.id, p_served: available,
    p_ua: h.get("user-agent"), p_ref: h.get("referer"),
  });

  if (!available) {
    return expired
      ? <Notice variant="expired" title="This QR has expired"
          body="The validity period for this document has passed. Please contact the sender for an up-to-date link." />
      : <Notice variant="inactive" title="This QR is not active"
          body="The document behind this QR is currently unavailable. Please contact the sender." />;
  }

  const ttl = Number(process.env.SIGNED_URL_TTL || 3600);
  const { data: signed } = await admin.storage
    .from("qr-files")
    .createSignedUrl(qr.file_path, ttl);

  if (!signed?.signedUrl)
    return <Notice variant="error" title="Couldn’t load the document" body="Something went wrong fetching the file. Please try again shortly." />;

  return (
    <main className="flex flex-col h-screen bg-[#faf7f2]">
      {/* Slim branded header */}
      <header className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white/80 backdrop-blur border-b border-stone-200/70 shrink-0">
        <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand-gradient text-white text-xs font-bold shadow-glow">IR</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900 truncate">{qr.title}</p>
          {qr.description && <p className="text-xs text-stone-500 truncate">{qr.description}</p>}
        </div>
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-stone-400 hidden sm:block">IRSCLASS</span>
      </header>

      {/* Document */}
      {qr.file_type === "pdf" ? (
        <iframe src={signed.signedUrl} title={qr.title} className="flex-1 w-full border-0" />
      ) : (
        <div className="flex-1 grid place-items-center p-4 overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signed.signedUrl} alt={qr.title}
            className="max-w-full max-h-full object-contain rounded-xl shadow-lift bg-white" />
        </div>
      )}
    </main>
  );
}

type Variant = "notfound" | "expired" | "inactive" | "error";

function Notice({ variant, title, body }: { variant: Variant; title: string; body: string }) {
  const styles: Record<Variant, { ring: string; icon: ReactNode }> = {
    expired: {
      ring: "from-amber-400 to-orange-500",
      icon: <path d="M12 8v5l3 2 M12 3a9 9 0 100 18 9 9 0 000-18z" />,
    },
    inactive: {
      ring: "from-stone-400 to-stone-500",
      icon: <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64 M12 2v10" />,
    },
    notfound: {
      ring: "from-rose-400 to-pink-500",
      icon: <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01 M12 3a9 9 0 100 18 9 9 0 000-18z" />,
    },
    error: {
      ring: "from-red-400 to-rose-500",
      icon: <path d="M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />,
    },
  };
  const s = styles[variant];
  return (
    <main className="relative min-h-screen grid place-items-center p-6 overflow-hidden bg-[#faf7f2]">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-rose-200/40 blur-3xl" />

      <div className="relative card p-8 sm:p-10 max-w-sm w-full text-center animate-fade-up">
        <div className={`mx-auto grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br ${s.ring} text-white shadow-lift`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">{s.icon}</svg>
        </div>
        <h1 className="mt-5 text-xl font-bold text-stone-900">{title}</h1>
        <p className="mt-2 text-sm text-stone-500 leading-relaxed">{body}</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          <span className="grid place-items-center w-5 h-5 rounded bg-brand-gradient text-white text-[9px]">IR</span>
          IRSCLASS
        </div>
      </div>
    </main>
  );
}
