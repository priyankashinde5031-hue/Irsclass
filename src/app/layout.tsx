import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IRSCLASS — QR Document Access",
  description: "Generate QR codes for images and PDFs with validity control.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
