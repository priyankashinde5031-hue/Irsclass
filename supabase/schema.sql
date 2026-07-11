-- =====================================================================
-- IRSCLASS — QR Document Access Platform
-- Supabase / Postgres schema  (additive, safe to re-run)
-- Run in: Supabase Dashboard > SQL Editor
-- Project account: irsclass7@gmail.com
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
-- pg_cron is OPTIONAL (only if you run expiry inside the DB instead of
-- Vercel Cron). Enable it from Dashboard > Database > Extensions.

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('admin', 'manager');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. profiles  (1:1 with auth.users — app identity + role)
--    Users are NEVER self-created. Admin creates them server-side.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text        not null,
  full_name   text,
  role        app_role    not null default 'manager',
  is_active   boolean     not null default true,
  created_by  uuid        references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. qr_codes  (one row per generated QR)
--    slug          -> stable, unguessable id embedded in the QR URL.
--    is_active     -> manual master switch (user can deactivate anytime).
--    valid_until   -> inclusive expiry date (validity end user picks).
--    Effective "viewable" = is_active AND current_date <= valid_until.
-- ---------------------------------------------------------------------
create table if not exists public.qr_codes (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  title       text        not null,              -- label / "user name" for filtering
  description text,
  file_path   text        not null,              -- path inside 'qr-files' bucket
  file_name   text        not null,
  file_type   text        not null check (file_type in ('image','pdf')),
  mime_type   text        not null,
  file_size   bigint,
  is_active   boolean     not null default true,
  valid_from  timestamptz not null default now(),
  valid_until date,                                -- NULL = never expires (optional)
  expired_at  timestamptz,                        -- stamped by the expiry job
  scan_count  integer     not null default 0,
  created_by  uuid        not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint valid_range check (valid_until is null or valid_until >= valid_from::date)
);

-- Migration for a database created before valid_until became optional
-- (safe/idempotent to re-run).
alter table public.qr_codes alter column valid_until drop not null;
alter table public.qr_codes drop constraint if exists valid_range;
alter table public.qr_codes add constraint valid_range
  check (valid_until is null or valid_until >= valid_from::date);

create index if not exists idx_qr_created_by  on public.qr_codes(created_by);
create index if not exists idx_qr_valid_until on public.qr_codes(valid_until);
create index if not exists idx_qr_created_at  on public.qr_codes(created_at);
create index if not exists idx_qr_title       on public.qr_codes(lower(title));

-- ---------------------------------------------------------------------
-- 4. scan_events  (analytics — one row per scan/view attempt)
-- ---------------------------------------------------------------------
create table if not exists public.scan_events (
  id          uuid        primary key default gen_random_uuid(),
  qr_code_id  uuid        not null references public.qr_codes(id) on delete cascade,
  scanned_at  timestamptz not null default now(),
  was_served  boolean     not null default true, -- false = blocked (expired/inactive)
  user_agent  text,
  referer     text
);
create index if not exists idx_scan_qr   on public.scan_events(qr_code_id);
create index if not exists idx_scan_time on public.scan_events(scanned_at);

-- ---------------------------------------------------------------------
-- 5. Helper functions (role checks used by RLS)
-- ---------------------------------------------------------------------
create or replace function public.app_current_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

create or replace function public.is_app_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$$;

-- ---------------------------------------------------------------------
-- 6. updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_qr_updated on public.qr_codes;
create trigger trg_qr_updated before update on public.qr_codes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 7. Scan registration RPC (called by the public viewer via service role)
-- ---------------------------------------------------------------------
create or replace function public.register_scan(
  p_qr uuid, p_served boolean, p_ua text default null, p_ref text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.scan_events(qr_code_id, was_served, user_agent, referer)
  values (p_qr, p_served, p_ua, p_ref);
  if p_served then
    update public.qr_codes set scan_count = scan_count + 1 where id = p_qr;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 8. Expiry job (run daily from Vercel Cron OR pg_cron).
--    Stamps expired_at once valid_until has passed. The status view
--    below already reports 'expired' in real time regardless.
-- ---------------------------------------------------------------------
create or replace function public.expire_qr_codes()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.qr_codes
     set expired_at = now()
   where valid_until < current_date and expired_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- Optional: schedule inside the DB instead of Vercel Cron.
-- select cron.schedule('expire-qr-daily', '5 0 * * *', 'select public.expire_qr_codes()');

-- ---------------------------------------------------------------------
-- 9. Views (real-time status + analytics). security_invoker = respect
--    caller RLS.
-- ---------------------------------------------------------------------
create or replace view public.qr_codes_status
with (security_invoker = on) as
select q.*,
  case
    when q.is_active = false             then 'deactivated'
    when q.valid_until < current_date    then 'expired'
    else 'active'
  end as status
from public.qr_codes q;

create or replace view public.analytics_summary
with (security_invoker = on) as
select
  count(*)                                                                as total_qr,
  count(*) filter (where created_at::date = current_date)                 as created_today,
  count(*) filter (where created_at >= date_trunc('week',  now()))        as created_this_week,
  count(*) filter (where created_at >= date_trunc('month', now()))        as created_this_month,
  count(*) filter (where is_active
                    and (valid_until is null or valid_until >= current_date))  as active_count,
  count(*) filter (where (not is_active)
                    or (valid_until is not null and valid_until < current_date)) as inactive_count,
  count(*) filter (where valid_until is not null and valid_until < current_date) as expired_count,
  count(*) filter (where is_active
                    and valid_until between current_date and current_date + 7) as expiring_7d,
  coalesce(sum(scan_count),0)                                             as total_scans
from public.qr_codes;

-- ---------------------------------------------------------------------
-- 10. Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.qr_codes    enable row level security;
alter table public.scan_events enable row level security;

-- profiles: self read; admin reads/writes all. (Creation/reset happens
-- server-side with the service role, which bypasses RLS.)
drop policy if exists "profiles_read"  on public.profiles;
create policy "profiles_read"  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- qr_codes: both roles can read/create/edit; DELETE is admin-only.
-- (Deactivation is also admin-only, but that's an UPDATE of is_active, not a
--  distinct SQL privilege, so it is enforced in the /api/qr/[id] route.)
drop policy if exists "qr_read"   on public.qr_codes;
create policy "qr_read"   on public.qr_codes for select using (public.is_app_user());
drop policy if exists "qr_insert" on public.qr_codes;
create policy "qr_insert" on public.qr_codes for insert with check (public.is_app_user());
drop policy if exists "qr_update" on public.qr_codes;
create policy "qr_update" on public.qr_codes for update using (public.is_app_user()) with check (public.is_app_user());
drop policy if exists "qr_delete" on public.qr_codes;
create policy "qr_delete" on public.qr_codes for delete using (public.is_admin());

-- scan_events: app users can read (analytics); inserts go through the
-- service role in the public viewer route, so no anon policy is needed.
drop policy if exists "scan_read" on public.scan_events;
create policy "scan_read" on public.scan_events for select using (public.is_app_user());

-- NOTE: The public /q/[slug] viewer is UNAUTHENTICATED. It never touches
-- these RLS policies — it runs server-side with the service role, looks
-- up a single row by slug, enforces is_active + valid_until itself, then
-- mints a short-lived signed URL. The qr_codes table therefore stays
-- fully private; nothing is exposed to the anon key.

-- ---------------------------------------------------------------------
-- 11. Storage bucket (private)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('qr-files', 'qr-files', false)
on conflict (id) do nothing;
-- No storage RLS policies added: all reads/writes happen through server
-- routes using the service role. Keep the bucket private.

-- =====================================================================
-- 12. BOOTSTRAP — create the first admin
--     Step A: Dashboard > Authentication > Users > "Add user"
--             email: irsclass7@gmail.com  (+ a password), confirm it.
--     Step B: run the block below to attach an admin profile.
-- =====================================================================
-- insert into public.profiles (id, email, full_name, role)
-- select id, email, 'Admin', 'admin'
-- from auth.users where email = 'irsclass7@gmail.com'
-- on conflict (id) do update set role = 'admin', is_active = true;
