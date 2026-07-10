"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type IconProps = { className?: string };
const Icon = {
  qr: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h.01M17 21h4v-4" />
    </svg>
  ),
  list: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  chart: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" rx="0.5" /><rect x="12" y="7" width="3" height="10" rx="0.5" /><rect x="17" y="13" width="3" height="4" rx="0.5" />
    </svg>
  ),
  users: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  logout: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

const NAV = [
  { href: "/generate",  label: "Generate QR",    icon: Icon.qr,    adminOnly: false },
  { href: "/qrcodes",   label: "All QR Codes",    icon: Icon.list,  adminOnly: false },
  { href: "/analytics", label: "Analytics",       icon: Icon.chart, adminOnly: false },
  { href: "/users",     label: "User Management", icon: Icon.users, adminOnly: true  },
];

export default function Sidebar({ role, email }: { role: "admin" | "manager"; email: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => !n.adminOnly || role === "admin");
  const initials = email.slice(0, 2).toUpperCase();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <>
      {/* Hamburger (mobile) */}
      <button onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2.5 rounded-xl bg-white shadow-card border border-stone-200" aria-label="Menu">
        <span className="block w-5 h-0.5 bg-stone-800 mb-1.5" />
        <span className="block w-5 h-0.5 bg-stone-800 mb-1.5" />
        <span className="block w-5 h-0.5 bg-stone-800" />
      </button>

      {open && <div className="md:hidden fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-30" onClick={() => setOpen(false)} />}

      <aside className={`fixed md:sticky md:top-0 z-40 top-0 left-0 h-screen w-72 flex flex-col
        bg-ink text-stone-300 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        {/* subtle top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-brand-gradient opacity-20 blur-2xl" />

        {/* Brand */}
        <div className="relative px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-brand-gradient shadow-glow text-white font-bold">IR</div>
            <div>
              <p className="text-white font-bold tracking-tight leading-none">IRSCLASS</p>
              <p className="text-[11px] text-stone-400 mt-1">QR Document Access</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-3 space-y-1 mt-2">
          {items.map((n) => {
            const active = path === n.href;
            const IconEl = n.icon;
            return (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? "bg-brand-gradient text-white shadow-glow"
                    : "text-stone-400 hover:text-white hover:bg-white/5"}`}>
                <IconEl className="w-5 h-5 shrink-0" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User + sign out */}
        <div className="relative p-3 mt-2 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="grid place-items-center w-9 h-9 rounded-full bg-white/10 text-white text-xs font-semibold">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white truncate">{email}</p>
              <span className="text-[10px] uppercase tracking-wide text-brand-light font-semibold">{role}</span>
            </div>
          </div>
          <button onClick={signOut}
            className="mt-1 w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-white/5 transition">
            <Icon.logout className="w-5 h-5" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
