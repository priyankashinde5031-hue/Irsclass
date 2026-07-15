import { PDFDocument } from "pdf-lib";

// Stamps a QR image onto the bottom-left corner of every page of a PDF.
// pdf-lib's coordinate origin is bottom-left already, so placement is direct.
const MARGIN = 24; // pt from each edge
const SIZE = 64;   // pt square

export async function stampPdfWithQr(pdfBytes: Buffer, qrPngBytes: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const qrImage = await pdfDoc.embedPng(qrPngBytes);
  for (const page of pdfDoc.getPages()) {
    page.drawImage(qrImage, { x: MARGIN, y: MARGIN, width: SIZE, height: SIZE });
  }
  const stamped = await pdfDoc.save();
  return Buffer.from(stamped);
}
