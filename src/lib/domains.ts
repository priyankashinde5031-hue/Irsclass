// The three domains a QR can point to. All three are custom domains on the
// same Vercel project / same Supabase backend — no duplicated code or data.
export const DOMAINS = ["irclasss.com", "ccsclass.org", "rinaclass.org"] as const;
export type Domain = (typeof DOMAINS)[number];
export const DEFAULT_DOMAIN: Domain = "irclasss.com";

export function isDomain(value: unknown): value is Domain {
  return typeof value === "string" && (DOMAINS as readonly string[]).includes(value);
}
