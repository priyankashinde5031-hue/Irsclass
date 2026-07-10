"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { qrPngDataUrl } from "@/lib/qr";

type Row = {
  id: string; slug: string; title: string; file_type: string;
  is_active: boolean; valid_from: string; valid_until: string;
  created_at: string; scan_count: number; status: string;
};

export default function QrCodesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [validOn, setValidOn] = useState("");     // filter: valid on this date
  const [createdOn, setCreatedOn] = useState(""); // filter: created on this date
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("qr_codes_status")
      .select("id,slug,title,file_type,is_active,valid_from,valid_until,created_at,scan_count,status")
      .order("created_at", { ascending: false });
    setRows((data as Row[]) || []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (name && !r.title.toLowerCase().includes(name.toLowerCase())) return false;
    if (validOn && !(r.valid_from.slice(0,10) <= validOn && validOn <= r.valid_until)) return false;
    if (createdOn && r.created_at.slice(0,10) !== createdOn) return false;
    return true;
  }), [rows, name, validOn, createdOn]);

  async function downloadQr(slug: string) {
    const png = await qrPngDataUrl(slug);
    const a = document.createElement("a");
    a.href = png; a.download = `qr-${slug}.png`; a.click();
  }

  async function toggle(id: string, next: boolean) {
    await fetch(`/api/qr/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    load();
  }

  const badge = (s: string) => ({
    active: "bg-green-100 text-green-700",
    expired: "bg-amber-100 text-amber-700",
    deactivated: "bg-gray-200 text-gray-600",
  }[s] || "bg-gray-100");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All QR Codes</h1>

      <div className="grid sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border">
        <input placeholder="Filter by name/title" value={name}
          onChange={(e) => setName(e.target.value)} className="border rounded-lg px-3 py-2" />
        <label className="text-xs text-gray-500 flex flex-col">Valid on
          <input type="date" value={validOn} onChange={(e) => setValidOn(e.target.value)}
            className="border rounded-lg px-3 py-2 text-gray-900" /></label>
        <label className="text-xs text-gray-500 flex flex-col">Created on
          <input type="date" value={createdOn} onChange={(e) => setCreatedOn(e.target.value)}
            className="border rounded-lg px-3 py-2 text-gray-900" /></label>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="p-3">Title</th><th className="p-3">Type</th>
              <th className="p-3">Valid until</th><th className="p-3">Created</th>
              <th className="p-3">Scans</th><th className="p-3">Status</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-4 text-gray-400" colSpan={7}>Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td className="p-4 text-gray-400" colSpan={7}>No QR codes.</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3 uppercase text-xs">{r.file_type}</td>
                <td className="p-3">{r.valid_until}</td>
                <td className="p-3">{r.created_at.slice(0,10)}</td>
                <td className="p-3">{r.scan_count}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${badge(r.status)}`}>{r.status}</span></td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => downloadQr(r.slug)} className="text-brand hover:underline">Download</button>
                  <button onClick={() => toggle(r.id, !r.is_active)} className="text-gray-500 hover:underline">
                    {r.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
