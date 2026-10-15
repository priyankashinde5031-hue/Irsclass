-- 0002 — allow the 4th domain (bvclass.com) on qr_codes.domain
-- Additive and safe to re-run. Existing rows are unaffected: every current
-- value is still in the allowed list.

alter table public.qr_codes
  drop constraint if exists qr_domain_valid;

alter table public.qr_codes
  add constraint qr_domain_valid
    check (domain in ('irclasss.com', 'ccsclass.org', 'rinaclass.org', 'bvclass.com'));
