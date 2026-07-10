"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/generate",  label: "Generate QR",   adminOnly: false },
  { href: "/qrcodes",   label: "All QR Codes",   adminOnly: false },
  { href: "/analytics", label: "Analytics",      adminOnly: false },
  { href: "/users",     label: "User Management", adminOnly: true  },
];

export default function Sidebar({ role, email }: { role: "admin" | "manager"; email: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => !n.adminOnly || role === "admin");

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <>
      {/* Hamburger */}
      <button onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 p-2 rounded-lg bg-white shadow" aria-label="Menu">
        <span className="block w-5 h-0.5 bg-gray-800 mb-1" />
        <span className="block w-5 h-0.5 bg-gray-800 mb-1" />
        <span className="block w-5 h-0.5 bg-gray-800" />
      </button>

      {open && <div className="md:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setOpen(false)} />}

      <aside className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-white border-r
        transform transition-transform ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-4 border-b">
          <p className="text-lg font-semibold">IRSCLASS</p>
          <p className="text-xs text-gray-500 truncate">{email}</p>
          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand/10 text-brand">
            {role}
          </span>
        </div>
        <nav className="p-2 space-y-1">
          {items.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm ${
                path === n.href ? "bg-brand text-white" : "hover:bg-gray-100"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={signOut}
          className="absolute bottom-4 left-4 right-4 text-sm text-gray-500 hover:text-gray-800 text-left px-3">
          Sign out
        </button>
      </aside>
    </>
  );
}
