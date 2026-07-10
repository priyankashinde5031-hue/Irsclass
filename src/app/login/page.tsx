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
    <div className="relative min-h-screen grid place-items-center p-4 overflow-hidden">
      {/* animated gradient backdrop */}
      <div className="absolute inset-0 bg-brand-gradient opacity-90" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-fuchsia-400/30 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* logo */}
        <div className="flex flex-col items-center mb-6 text-white">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/30 text-xl font-bold shadow-lift">IR</div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">IRSCLASS</h1>
          <p className="text-sm text-white/80">QR Document Access Platform</p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lift p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Welcome back</h2>
            <p className="page-sub">Sign in to continue</p>
          </div>

          <div>
            <label className="label">Email</label>
            <input className="input" placeholder="you@irsclass.in" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" placeholder="••••••••" type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

          <button onClick={submit} disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-xs text-center text-stone-400">Accounts are created by an administrator.</p>
        </div>
      </div>
    </div>
  );
}
