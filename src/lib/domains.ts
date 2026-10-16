// Domains a QR can point to. The first three are fixed custom domains on the
// same Vercel project / same Supabase backend. A fourth, optional domain is
// supplied by the operator at runtime via NEXT_PUBLIC_DOMAIN_4 so it can be
// configured per environment without a code change. All share one backend —
// no duplicated code or data.
const BASE_DOMAINS = ["irclasss.com", "ccsclass.org", "rinaclass.org"] as const;

// Optional operator-configured 4th domain. Whoever sets this is responsible for
// using a domain they own that does not impersonate another company or brand.
const EXTRA_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN_4?.trim() || "";

export const DOMAINS: string[] = EXTRA_DOMAIN
  ? [...BASE_DOMAINS, EXTRA_DOMAIN]
  : [...BASE_DOMAINS];

export type Domain = string;
export const DEFAULT_DOMAIN: Domain = "irclasss.com";

export function isDomain(value: unknown): value is Domain {
  return typeof value === "string" && DOMAINS.includes(value);
}
