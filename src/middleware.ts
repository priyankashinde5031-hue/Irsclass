import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session and gates the /(app) area. The public
// viewer (/q/*), the login page, and /api/cron stay open.
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(list: { name: string; value: string; options?: any }[]) {
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  const isProtected = !["/login", "/q", "/api/cron"].some((p) => path.startsWith(p));

  if (!user && isProtected && path !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/generate", req.url));
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
};
