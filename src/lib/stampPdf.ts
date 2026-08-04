import { PDFDocument } from "pdf-lib";

// Stamps a QR image onto a bottom corner of every page of a PDF.
// pdf-lib's coordinate origin is bottom-left already, so vertical placement is
// direct; horizontal placement flips based on the requested corner.
const MARGIN = 24; // pt from each edge
const SIZE = 64;   // pt square

export type StampCorner = "left" | "right";

export async function stampPdfWithQr(
  pdfBytes: Buffer,
  qrPngBytes: Buffer,
  corner: StampCorner = "left",
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const qrImage = await pdfDoc.embedPng(qrPngBytes);
  for (const page of pdfDoc.getPages()) {
    const x = corner === "right" ? page.getWidth() - MARGIN - SIZE : MARGIN;
    page.drawImage(qrImage, { x, y: MARGIN, width: SIZE, height: SIZE });
  }
  const stamped = await pdfDoc.save();
  return Buffer.from(stamped);
}
