"use client";
import { useState } from "react";
import { qrPngDataUrl, viewerUrl } from "@/lib/qr";

type Done = { slug: string; png: string; title: string };

export default function GeneratePage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap

  function pickFile(f: File | null) {
    setErr(null);
    if (f && f.size > MAX_BYTES) { setErr("File exceeds the 5 MB limit."); setFile(null); return; }
    setFile(f);
  }

  async function generate() {
    setErr(null);
    if (!file || !title || !validUntil) { setErr("File, title and validity date are required."); return; }
    if (file.size > MAX_BYTES) { setErr("File exceeds the 5 MB limit."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("title", title); fd.append("valid_until", validUntil);
      if (description.trim()) fd.append("description", description.trim());
      const res = await fetch("/api/qr", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const png = await qrPngDataUrl(data.slug);
      setDone({ slug: data.slug, png, title });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  function reset() { setFile(null); setTitle(""); setDescription(""); setValidUntil(""); setDone(null); setErr(null); }

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-semibold">QR ready</h1>
        <p className="text-gray-500">Valid from {today} to {validUntil}.</p>
        <img src={done.png} alt="QR code" className="mx-auto w-64 h-64 border rounded-xl bg-white p-3" />
        <p className="text-xs text-gray-400 break-all">{viewerUrl(done.slug)}</p>
        <div className="flex gap-3 justify-center">
          <a href={done.png} download={`qr-${done.slug}.png`}
            className="bg-brand text-white px-4 py-2 rounded-lg">Download QR</a>
          <button onClick={reset} className="border px-4 py-2 rounded-lg">Generate more</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Generate QR</h1>
      <p className="text-sm text-gray-500">Upload an image or PDF, set validity, get a scannable QR.</p>

      <label className="block text-sm font-medium">Document (image or PDF)</label>
      <input type="file" accept="image/*,application/pdf"
        onChange={(e) => pickFile(e.target.files?.[0] || null)}
        className="w-full border rounded-lg px-3 py-2 bg-white" />
      <p className="text-xs text-gray-400">Max 5 MB.</p>

      <label className="block text-sm font-medium">Title / Name</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Batch-A Notice" />

      <label className="block text-sm font-medium">Description <span className="text-gray-400 font-normal">(optional)</span></label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded-lg px-3 py-2" rows={2}
        placeholder="What is this document about?" />

      <label className="block text-sm font-medium">Valid until</label>
      <input type="date" min={today} value={validUntil}
        onChange={(e) => setValidUntil(e.target.value)}
        className="w-full border rounded-lg px-3 py-2" />
      <p className="text-xs text-gray-400">Active from today ({today}) until the date above.</p>

      {err && <p className="text-sm text-red-600">{err}</p>}
      <button onClick={generate} disabled={busy}
        className="w-full bg-brand text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
        {busy ? "Generating…" : "Generate QR"}
      </button>
    </div>
  );
}
