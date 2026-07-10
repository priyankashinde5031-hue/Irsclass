import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("analytics_summary").select("*").single();
  const s = data || {};
  const cards: [string, number][] = [
    ["Created today", s.created_today], ["This week", s.created_this_week],
    ["This month", s.created_this_month], ["Active", s.active_count],
    ["Expired", s.expired_count], ["Expiring in 7 days", s.expiring_7d],
    ["Total QR codes", s.total_qr], ["Total scans", s.total_scans],
  ];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, val]) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <p className="text-3xl font-semibold">{val ?? 0}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
