"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    router.push("/generate"); router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">IRSCLASS</h1>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </div>
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Password" type="password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button onClick={submit} disabled={loading}
          className="w-full bg-brand text-white rounded-lg py-2 font-medium disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-xs text-gray-400">Accounts are created by an administrator.</p>
      </div>
    </div>
  );
}
