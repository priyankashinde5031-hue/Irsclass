-- =====================================================================
-- 0001 — domain selection + PDF stamp tracking (additive, safe to re-run)
-- Adds:
--   qr_codes.domain             -- which of the 3 domains this QR points to
--   qr_codes.stamped_file_path  -- path of the QR-stamped PDF copy (nullable)
--   qr_codes.stamp_error        -- set when stamping fails, so it's flagged
-- All columns are additive/backward-compatible: every existing row gets the
-- default domain and null stamp fields, so every QR already printed and
-- distributed keeps resolving exactly as it does today.
-- =====================================================================

alter table public.qr_codes
  add column if not exists domain text not null default 'irclasss.com';

alter table public.qr_codes
  drop constraint if exists qr_domain_valid;
alter table public.qr_codes
  add constraint qr_domain_valid
    check (domain in ('irclasss.com', 'ccsclass.org', 'rinaclass.org'));

alter table public.qr_codes
  add column if not exists stamped_file_path text;

alter table public.qr_codes
  add column if not exists stamp_error text;

-- qr_codes_status is defined as `select q.*, ...` — Postgres freezes a view's
-- column list at creation time, so adding columns above does NOT flow through
-- to the view automatically. The 3 new columns land (via q.*) before the
-- final `status` alias, which CREATE OR REPLACE VIEW can't do (it only
-- allows appending at the end) — so drop and recreate instead. Views hold
-- no data, so this is safe.
drop view if exists public.qr_codes_status;
create view public.qr_codes_status
with (security_invoker = on) as
select q.*,
  case
    when q.is_active = false             then 'deactivated'
    when q.valid_until < current_date    then 'expired'
    else 'active'
  end as status
from public.qr_codes q;
