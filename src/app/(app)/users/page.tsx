"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type U = { id: string; email: string; full_name: string | null; role: string; is_active: boolean };

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [email, setEmail] = useState(""); const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState(""); const [role, setRole] = useState("manager");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch("/api/users"); const d = await r.json();
    if (r.ok) setUsers(d.users);
  }
  useEffect(() => {
    load();
    (async () => {
      const { data: { user } } = await createClient().auth.getUser();
      setMeId(user?.id ?? null);
    })();
  }, []);

  async function create() {
    setMsg(null); setBusy(true);
    const r = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name: fullName, password, role }),
    });
    const d = await r.json(); setBusy(false);
    if (!r.ok) { setMsg(d.error); return; }
    setEmail(""); setFullName(""); setPassword(""); setRole("manager"); setMsg("User created."); load();
  }

  async function resetPw(id: string) {
    const pw = prompt("Set a new password for this user:");
    if (!pw) return;
    const r = await fetch(`/api/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setMsg(r.ok ? "Password updated." : "Failed to update password.");
  }

  async function toggleActive(u: U) {
    const action = u.is_active ? "Disable" : "Enable";
    if (!confirm(`${action} ${u.email}?`)) return;
    const r = await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); setMsg(d.error || "Update failed."); return; }
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">User Management</h1>
        <p className="page-sub mt-1">Create managers and admins, reset passwords, enable or disable access.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Create form */}
        <div className="card p-6 lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-stone-900">Add a user</h2>
          <div>
            <label className="label">Email</label>
            <input placeholder="name@example.com" value={email} onChange={(e)=>setEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Full name</label>
            <input placeholder="Full name" value={fullName} onChange={(e)=>setFullName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Password <span className="text-stone-400 font-normal">(you choose)</span></label>
            <input placeholder="Set a password" value={password} onChange={(e)=>setPassword(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={role} onChange={(e)=>setRole(e.target.value)} className="input">
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button onClick={create} disabled={busy} className="btn-primary w-full">{busy ? "Creating…" : "Create user"}</button>
          {msg && <p className="text-sm text-stone-600 bg-stone-50 rounded-lg px-3 py-2">{msg}</p>}
        </div>

        {/* Users table */}
        <div className="card overflow-hidden lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.length === 0 && <tr><td className="px-5 py-8 text-stone-400" colSpan={4}>No users yet.</td></tr>}
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-stone-900">{u.full_name || "—"}</p>
                      <p className="text-xs text-stone-500">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge uppercase ${u.role === "admin" ? "bg-brand-50 text-brand ring-1 ring-brand-100" : "bg-stone-100 text-stone-600"}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${u.is_active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-stone-100 text-stone-500 ring-1 ring-stone-200"}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-3 justify-end items-center">
                        <button onClick={() => resetPw(u.id)} className="font-medium text-brand hover:text-brand-dark">Reset password</button>
                        {u.id === meId
                          ? <span className="badge bg-brand-50 text-brand ring-1 ring-brand-100">You</span>
                          : <button onClick={() => toggleActive(u)} className="font-medium text-stone-500 hover:text-stone-800">{u.is_active ? "Disable" : "Enable"}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
