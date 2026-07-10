# IRSCLASS — Development Plan

Same discipline as the Hipla hub: **additive-only migrations**, **staging /
preview before production**, **small frequent deploys**. Each milestone ends
in something deployable and testable. This scaffold already covers M0–M6 in
skeleton form; the plan is how to harden and finish it.

---

## M0 — Foundation ✅ (scaffolded)
- [ ] Create the Supabase project under `irsclass7@gmail.com`.
- [ ] Run `supabase/schema.sql` in the SQL Editor.
- [ ] Create bucket `qr-files` (the schema does this; verify it's **private**).
- [ ] Push this scaffold to `github.com/priyankashinde5031-hue/Irsclass`.
- [ ] `npm install`, copy `.env.example` → `.env.local`, fill keys.
- [ ] Bootstrap first admin (schema §12): add auth user `irsclass7@gmail.com`,
      then run the promote block.
- **Done when:** `npm run dev` runs and you can sign in as admin.

## M1 — Auth + app shell ✅ (scaffolded)
- [x] Login, middleware route-gating, hamburger sidebar, role-based nav.
- [ ] Harden `/users` with a server-side admin guard (not just hidden nav).
- **Done when:** manager and admin see the correct menu; logout works.

## M2 — Generate QR ✅ (scaffolded)
- [x] Upload → `/api/qr` → storage + row → QR render → download → "Generate more".
- [ ] Add file-size + type validation, upload progress, nicer errors.
- **Done when:** generating a QR, scanning it on a phone shows the document.

## M3 — Public viewer ✅ (scaffolded)
- [x] `/q/[slug]`: validity checks, scan logging, signed URL, image/PDF render.
- [ ] Polish expired/inactive screens; test large PDFs and iOS Safari.
- **Done when:** expired/deactivated QRs show the block screen; valid ones render.

## M4 — All QR Codes list ✅ (scaffolded)
- [x] Table, filters (name, valid-on, created-on), per-row download + toggle.
- [ ] Add pagination for large volumes, and a "delete" confirm.
- **Done when:** filters combine correctly and download works per row.

## M5 — Analytics ✅ (scaffolded)
- [x] KPI cards from `analytics_summary`.
- [ ] Optional: 30-day scan trend chart, upcoming-expiry table.
- **Done when:** counts match reality after generating test QRs.

## M6 — User Management ✅ (scaffolded, admin-only)
- [x] Create user (admin-chosen password), reset password, enable/disable, role.
- [ ] Confirmation dialogs; prevent an admin disabling their own account.
- **Done when:** admin creates a manager who can log in and use M2–M5.

## M7 — Expiry automation
- [ ] Deploy; `vercel.json` cron hits `/api/cron/expire` daily (00:05 UTC).
- [ ] Add `Authorization: Bearer <CRON_SECRET>` in Vercel cron settings.
- [ ] (Alt) enable pg_cron and use the scheduled call in the schema instead.
- **Done when:** a past-dated QR shows `expired` and gets `expired_at` stamped.

## M8 — QA + production
- [ ] Cross-device scan test (Android/iOS), PDF + image.
- [ ] Verify service-role key is server-only; anon key can't read `qr_codes`.
- [ ] Point `NEXT_PUBLIC_APP_URL` at the production domain (QR content depends
      on it — set it **before** generating production QRs).
- [ ] Deploy to production.

---

## Later (backlog)
- Replace-file action (swap the document behind an existing QR, same slug).
- Bulk generate / bulk download (zip of QizR PNGs).
- Per-QR scan detail view.
- Custom domain for shorter QR URLs.
