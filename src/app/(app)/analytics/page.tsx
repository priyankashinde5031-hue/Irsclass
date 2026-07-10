import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Card = { label: string; value: number; accent: string; icon: string };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("analytics_summary").select("*").single();
  const s: any = data || {};

  const cards: Card[] = [
    { label: "Total QR codes",     value: s.total_qr ?? 0,          accent: "from-indigo-500 to-violet-500",  icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3z" },
    { label: "Total scans",        value: s.total_scans ?? 0,       accent: "from-sky-500 to-cyan-500",        icon: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 9a3 3 0 100 6 3 3 0 000-6z" },
    { label: "Active",             value: s.active_count ?? 0,      accent: "from-emerald-500 to-green-500",   icon: "M20 6 9 17l-5-5" },
    { label: "Expiring in 7 days", value: s.expiring_7d ?? 0,       accent: "from-amber-500 to-orange-500",    icon: "M12 8v4l3 3 M12 3a9 9 0 100 18 9 9 0 000-18z" },
    { label: "Expired",            value: s.expired_count ?? 0,     accent: "from-rose-500 to-red-500",        icon: "M18 6 6 18 M6 6l12 12" },
    { label: "Created today",      value: s.created_today ?? 0,     accent: "from-fuchsia-500 to-pink-500",    icon: "M8 2v4M16 2v4M3 10h18 M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
    { label: "This week",          value: s.created_this_week ?? 0, accent: "from-violet-500 to-purple-500",   icon: "M8 2v4M16 2v4M3 10h18 M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
    { label: "This month",         value: s.created_this_month ?? 0,accent: "from-blue-500 to-indigo-500",     icon: "M8 2v4M16 2v4M3 10h18 M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-sub mt-1">Live overview of your QR codes and scan activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5 hover:shadow-lift hover:-translate-y-0.5 transition-all">
            <div className={`grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-card`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d={c.icon} /></svg>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-stone-900 tabular-nums">{c.value}</p>
            <p className="text-sm text-stone-500">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
