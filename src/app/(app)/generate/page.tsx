"use client";
import { useState } from "react";
import { qrPngDataUrl, viewerUrl, qrFileName } from "@/lib/qr";
import { DOMAINS, DEFAULT_DOMAIN, type Domain } from "@/lib/domains";

type Done = { id: string; slug: string; png: string; title: string; domain: Domain; stampAvailable: boolean };

export default function GeneratePage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [domain, setDomain] = useState<Domain>(DEFAULT_DOMAIN);
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
    if (!file || !title) { setErr("File and title are required."); return; }
    if (file.size > MAX_BYTES) { setErr("File exceeds the 5 MB limit."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file); fd.append("title", title); fd.append("domain", domain);
      if (validUntil) fd.append("valid_until", validUntil);
      if (description.trim()) fd.append("description", description.trim());
      const res = await fetch("/api/qr", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const png = await qrPngDataUrl(data.slug, domain);
      setDone({ id: data.id, slug: data.slug, png, title, domain, stampAvailable: !!data.stampAvailable });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  function reset() { setFile(null); setTitle(""); setDescription(""); setValidUntil(""); setDomain(DEFAULT_DOMAIN); setDone(null); setErr(null); }

  async function downloadStampedFile(id: string) {
    const res = await fetch(`/api/qr/${id}/download-stamped`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Couldn't download the file"); return; }
    window.location.href = data.url;
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card p-8 text-center space-y-5">
          <div className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-green-100 text-green-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <div>
            <h1 className="page-title">QR ready</h1>
            <p className="page-sub mt-1">“{done.title}” · {validUntil ? `valid ${today} → ${validUntil}` : "no expiry"}</p>
          </div>
          <img src={done.png} alt="QR code" className="mx-auto w-60 h-60 rounded-2xl border border-stone-200 bg-white p-3 shadow-card" />
          <p className="text-xs text-stone-400 break-all">{viewerUrl(done.slug, done.domain)}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href={done.png} download={qrFileName(done.title, done.slug)} className="btn-primary">Download QR</a>
            {done.stampAvailable && (
              <button onClick={() => downloadStampedFile(done.id)} className="btn-primary">Download file</button>
            )}
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
        <p className="page-sub mt-1">Upload an image or PDF, optionally set a validity date, get a scannable QR.</p>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">Document <span className="text-stone-400 font-normal">(image or PDF, max 5 MB)</span></label>
          <input type="file" accept="image/*,application/pdf"
            onChange={(e) => pickFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-stone-600 rounded-xl border border-stone-200 bg-white
              file:mr-4 file:border-0 file:bg-brand-gradient file:text-white file:px-4 file:py-2.5 file:text-sm file:font-medium
              file:cursor-pointer cursor-pointer" />
          {file && <p className="mt-1.5 text-xs text-stone-500">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
        </div>

        <div>
          <label className="label">Title / Name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Batch-A Notice" />
        </div>

        <div>
          <label className="label">Description <span className="text-stone-400 font-normal">(optional)</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input" rows={2}
            placeholder="What is this document about?" />
        </div>

        <div>
          <label className="label">Domain</label>
          <select value={domain} onChange={(e) => setDomain(e.target.value as Domain)} className="input">
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}{d === DEFAULT_DOMAIN ? " (primary)" : ""}</option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-stone-400">Which domain this QR opens on when scanned.</p>
        </div>

        <div>
          <label className="label">Valid until <span className="text-stone-400 font-normal">(optional)</span></label>
          <input type="date" min={today} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="input" />
          <p className="mt-1.5 text-xs text-stone-400">
            {validUntil ? `Active from today (${today}) until the date above.` : "Leave blank for a QR that never expires."}
          </p>
        </div>

        {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

        <button onClick={generate} disabled={busy} className="btn-primary w-full">
          {busy ? "Generating…" : "Generate QR"}
        </button>
      </div>
    </div>
  );
}
