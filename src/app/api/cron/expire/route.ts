import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("expire_qr_codes");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expired: data });
}
