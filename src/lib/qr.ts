import QRCode from "qrcode";

// Builds the stable public URL that gets encoded into the QR image.
export function viewerUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base}/q/${slug}`;
}

// Returns a PNG data URL for downloading / previewing the QR.
export async function qrPngDataUrl(slug: string): Promise<string> {
  return QRCode.toDataURL(viewerUrl(slug), {
    width: 512, margin: 2, errorCorrectionLevel: "M",
  });
}
