"use client";
import { useEffect, useState } from "react";

type U = { id: string; email: string; full_name: string | null; role: string; is_active: boolean };

export default function UsersPage() {
  const [users, setUsers] = useState<U[]>([]);
  const [email, setEmail] = useState(""); const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState(""); const [role, setRole] = useState("manager");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/users"); const d = await r.json();
    if (r.ok) setUsers(d.users);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    setMsg(null);
    const r = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name: fullName, password, role }),
    });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error); return; }
    setEmail(""); setFullName(""); setPassword(""); setRole("manager"); load();
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
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">User Management</h1>

      <div className="bg-white border rounded-xl p-4 grid sm:grid-cols-2 gap-3 max-w-2xl">
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="border rounded-lg px-3 py-2" />
        <input placeholder="Full name" value={fullName} onChange={(e)=>setFullName(e.target.value)} className="border rounded-lg px-3 py-2" />
        <input placeholder="Password (you choose)" value={password} onChange={(e)=>setPassword(e.target.value)} className="border rounded-lg px-3 py-2" />
        <select value={role} onChange={(e)=>setRole(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={create} className="bg-brand text-white rounded-lg py-2 sm:col-span-2">Create user</button>
        {msg && <p className="text-sm text-gray-600 sm:col-span-2">{msg}</p>}
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border max-w-2xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3 uppercase text-xs">{u.role}</td>
                <td className="p-3">{u.is_active ? "Active" : "Disabled"}</td>
                <td className="p-3 flex gap-3">
                  <button onClick={() => resetPw(u.id)} className="text-brand hover:underline">Reset password</button>
                  <button onClick={() => toggleActive(u)} className="text-gray-500 hover:underline">{u.is_active ? "Disable" : "Enable"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
