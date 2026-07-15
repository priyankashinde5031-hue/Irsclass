import QRCode from "qrcode";
import { DEFAULT_DOMAIN } from "@/lib/domains";

// Builds the stable public URL that gets encoded into the QR image. The
// default domain keeps using NEXT_PUBLIC_APP_URL exactly as before (whatever
// that resolves to per environment) so every existing/default-domain QR
// keeps resolving unchanged. Only the other two domains get a hardcoded
// https:// URL, since there's no per-domain env var for those.
export function viewerUrl(slug: string, domain: string = DEFAULT_DOMAIN) {
  if (domain !== DEFAULT_DOMAIN) return `https://${domain}/q/${slug}`;
  const base = process.env.NEXT_PUBLIC_APP_URL || `https://${DEFAULT_DOMAIN}`;
  return `${base}/q/${slug}`;
}

// Returns a PNG data URL for downloading / previewing the QR.
export async function qrPngDataUrl(slug: string, domain?: string): Promise<string> {
  return QRCode.toDataURL(viewerUrl(slug, domain), {
    width: 512, margin: 2, errorCorrectionLevel: "M",
  });
}

// Turns a user title into a safe download filename, e.g. "Batch-A Notice" -> "batch-a-notice.png".
export function qrFileName(title: string, slug: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || `qr-${slug}`}.png`;
}
