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
      <div className="max-w-md mx-auto">
        <div className="card p-8 text-center space-y-5">
          <div className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-green-100 text-green-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <div>
            <h1 className="page-title">QR ready</h1>
            <p className="page-sub mt-1">“{done.title}” · valid {today} → {validUntil}</p>
          </div>
          <img src={done.png} alt="QR code" className="mx-auto w-60 h-60 rounded-2xl border border-slate-200 bg-white p-3 shadow-card" />
          <p className="text-xs text-slate-400 break-all">{viewerUrl(done.slug)}</p>
          <div className="flex gap-3 justify-center">
            <a href={done.png} download={`qr-${done.slug}.png`} className="btn-primary">Download QR</a>
            <button onClick={reset} className="btn-ghost">Generate more</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="page-title">Generate QR</h1>
        <p className="page-sub mt-1">Upload an image or PDF, set validity, get a scannable QR.</p>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Document <span className="text-slate-400 font-normal">(image or PDF, max 5 MB)</span></label>
          <input type="file" accept="image/*,application/pdf"
            onChange={(e) => pickFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-600 rounded-xl border border-slate-200 bg-white
              file:mr-4 file:border-0 file:bg-brand-gradient file:text-white file:px-4 file:py-2.5 file:text-sm file:font-medium
              file:cursor-pointer cursor-pointer" />
          {file && <p className="mt-1.5 text-xs text-slate-500">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
        </div>

        <div>
          <label className="label">Title / Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Batch-A Notice" />
        </div>

        <div>
          <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={2}
            placeholder="What is this document about?" />
        </div>

        <div>
          <label className="label">Valid until</label>
          <input type="date" min={today} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="input" />
          <p className="mt-1.5 text-xs text-slate-400">Active from today ({today}) until the date above.</p>
        </div>

        {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

        <button onClick={generate} disabled={busy} className="btn-primary w-full">
          {busy ? "Generating…" : "Generate QR"}
        </button>
      </div>
    </div>
  );
}
