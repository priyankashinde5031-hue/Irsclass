"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { qrPngDataUrl, qrFileName } from "@/lib/qr";
import { DOMAINS } from "@/lib/domains";

type Row = {
  id: string; slug: string; title: string; file_type: string;
  is_active: boolean; valid_from: string; valid_until: string | null;
  created_at: string; scan_count: number; status: string;
  domain: string; stamp_error: string | null; stamped_file_path: string | null;
};

export default function QrCodesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [validOn, setValidOn] = useState("");     // filter: valid on this date
  const [createdOn, setCreatedOn] = useState(""); // filter: created on this date
  const [classFilter, setClassFilter] = useState(""); // filter: domain/class
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);  // gates deactivate/delete
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("qr_codes_status")
      .select("id,slug,title,file_type,is_active,valid_from,valid_until,created_at,scan_count,status,domain,stamp_error,stamped_file_path")
      .order("created_at", { ascending: false });
    setRows((data as Row[]) || []); setLoading(false);
  }
  useEffect(() => {
    load();
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setIsAdmin(data?.role === "admin");
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (name && !r.title.toLowerCase().includes(name.toLowerCase())) return false;
    if (validOn && !(r.valid_from.slice(0,10) <= validOn && (r.valid_until === null || validOn <= r.valid_until))) return false;
    if (createdOn && r.created_at.slice(0,10) !== createdOn) return false;
    if (classFilter && r.domain !== classFilter) return false;
    return true;
  }), [rows, name, validOn, createdOn, classFilter]);

  // Reset to page 1 whenever the filter set changes.
  useEffect(() => { setPage(1); }, [name, validOn, createdOn, classFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function downloadQr(slug: string, title: string, domain: string) {
    const png = await qrPngDataUrl(slug, domain);
    const a = document.createElement("a");
    a.href = png; a.download = qrFileName(title, slug); a.click();
  }

  async function downloadStampedFile(id: string) {
    const res = await fetch(`/api/qr/${id}/download-stamped`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || "Couldn't download the file"); return; }
    window.location.href = data.url;
  }

  async function toggle(id: string, next: boolean) {
    const res = await fetch(`/api/qr/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Update failed"); return; }
    load();
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes the QR and its file permanently.`)) return;
    const res = await fetch(`/api/qr/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error || "Delete failed"); return; }
    load();
  }

  const badge = (s: string) => ({
    active:      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    expired:     "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    deactivated: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
  }[s] || "bg-stone-100 text-stone-600");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">All QR Codes</h1>
        <p className="page-sub mt-1">{filtered.length} of {rows.length} shown.</p>
      </div>

      <div className="card p-4 grid sm:grid-cols-4 gap-3">
        <div>
          <label className="label">Name / title</label>
          <input placeholder="Search…" value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Class (domain)</label>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input">
            <option value="">All</option>
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Valid on</label>
          <input type="date" value={validOn} onChange={(e) => setValidOn(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Created on</label>
          <input type="date" value={createdOn} onChange={(e) => setCreatedOn(e.target.value)} className="input" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">QR inserted file</th>
                <th className="px-5 py-3 font-semibold">Domain</th>
                <th className="px-5 py-3 font-semibold">Valid until</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Scans</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading && <tr><td className="px-5 py-8 text-stone-400" colSpan={9}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td className="px-5 py-8 text-stone-400" colSpan={9}>No QR codes match your filters.</td></tr>}
              {paged.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-stone-900">{r.title}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-stone-100 text-stone-600 uppercase">{r.file_type}</span>
                    {r.file_type === "pdf" && r.stamp_error && (
                      <span title={r.stamp_error} className="badge ml-1.5 bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                        ⚠ stamp failed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.file_type === "pdf" && r.stamped_file_path ? (
                      <button onClick={() => downloadStampedFile(r.id)} className="font-medium text-brand hover:text-brand-dark">Download</button>
                    ) : (
                      <span className="text-stone-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><span className="badge bg-stone-100 text-stone-600">{r.domain}</span></td>
                  <td className="px-5 py-3.5 text-stone-600 tabular-nums">{r.valid_until ?? <span className="text-stone-400 italic normal-case">No expiry</span>}</td>
                  <td className="px-5 py-3.5 text-stone-600 tabular-nums">{r.created_at.slice(0,10)}</td>
                  <td className="px-5 py-3.5 text-stone-600 tabular-nums">{r.scan_count}</td>
                  <td className="px-5 py-3.5"><span className={`badge ${badge(r.status)}`}>{r.status}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => downloadQr(r.slug, r.title, r.domain)} className="font-medium text-brand hover:text-brand-dark">Download QR</button>
                      {isAdmin && (
                        <button onClick={() => toggle(r.id, !r.is_active)} className="font-medium text-stone-500 hover:text-stone-800">
                          {r.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => remove(r.id, r.title)} className="font-medium text-red-600 hover:text-red-700">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 text-sm">
            <span className="text-stone-500">
              Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(current - 1)} disabled={current <= 1}
                className="btn-ghost px-3 py-1.5 disabled:opacity-40">Prev</button>
              <span className="text-stone-500 tabular-nums">Page {current} / {pageCount}</span>
              <button onClick={() => setPage(current + 1)} disabled={current >= pageCount}
                className="btn-ghost px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
