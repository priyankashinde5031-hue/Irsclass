# IRSCLASS — QR Document Access Platform · Spec

Internal tool: upload an image or PDF, get a scannable QR. Anyone who scans
sees the document until it is deactivated or its validity date passes.

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Postgres + Auth +
Storage) · Vercel · Tailwind.
**Repo:** `github.com/priyankashinde5031-hue/Irsclass`
**Supabase account:** `irsclass7@gmail.com` (its own project — nothing shared
with existing projects).

---

## 1. Core concept — the QR link architecture (the "better option" you asked about)

The QR encodes **one stable URL** that never changes for the life of the QR:

```
https://irsclass.vercel.app/q/<slug>
```

`slug` is a 12-char unguessable id (nanoid). When someone scans, that route
(`/q/[slug]`) runs **server-side with the service role** and, on every scan:

1. looks up the single row by slug,
2. enforces `is_active AND today <= valid_until`,
3. logs the scan (analytics),
4. mints a **short-lived signed URL** to the file in private storage
   (`SIGNED_URL_TTL`, default **1 hour**),
5. renders the image/PDF inline (branded "expired / not active" page otherwise).

### Why this beats putting a file link in the QR

| Approach | Problem |
|---|---|
| Encode the signed file URL in the QR | QR dies after 1 hour. Unusable. |
| Encode a public file URL | Anyone keeps access forever; you can't deactivate or expire. |
| **Stable `/q/<slug>` + signed URL minted per scan (this design)** | QR is permanent; file stays private; you keep full active/validity control; every scan is logged. |

So your instinct was right — keep the **1-hour signed URL**, but it's minted
*server-side per scan* behind the permanent QR route, not baked into the QR.
The 1 hour only governs how long that one loaded view stays fetchable (relevant
if someone keeps the tab open, especially for PDFs). It's set via
`SIGNED_URL_TTL` — raise/lower freely.

---

## 2. Roles

| Capability | Admin | Manager |
|---|:--:|:--:|
| Generate QR, download, list, filter | ✅ | ✅ |
| Activate / deactivate a QR | ✅ | ❌ |
| Delete a QR | ✅ | ❌ |
| Analytics | ✅ | ✅ |
| User Management (create users, set/reset passwords, roles) | ✅ | ❌ |

Accounts are **never self-created**. Admin creates them with an email + a
password of the admin's choosing, and can regenerate that password anytime.
Role is stored in `profiles.role`. The manager is identical to admin **minus**
the User Management module.

---

## 3. Left hamburger menu — four modules

1. **Generate QR** — the landing screen (no analytics in the user's face).
   Upload image/PDF → set title + validity date → Generate → shows the QR with
   **Download QR** and **Generate more** (resets the form). `/generate`
2. **All QR Codes** — every QR to date, with filters: **name/title**,
   **valid-on date**, **created-on date**. Per-row **Download QR** and
   **Activate/Deactivate**. `/qrcodes`
3. **Analytics** — created today / this week / this month, active, expired,
   expiring in 7 days, total QR, total scans. `/analytics`
4. **User Management** *(admin only, hidden from managers)* — add users,
   choose their password, reset password, enable/disable, set role. `/users`

---

## 4. Data model (see `supabase/schema.sql`)

- **profiles** — 1:1 with `auth.users`; `role` (`admin`|`manager`), `is_active`.
- **qr_codes** — `slug`, `title`, `file_path`, `file_type` (`image`|`pdf`),
  `is_active` (manual switch), `valid_from`, `valid_until` (inclusive expiry),
  `expired_at` (stamped by job), `scan_count`, `created_by`.
- **scan_events** — one row per scan (`was_served`, `user_agent`, `referer`).
- **Views** — `qr_codes_status` (real-time `active`/`expired`/`deactivated`),
  `analytics_summary`.
- **Storage** — private bucket `qr-files`; files at `<slug>/<ts>.<ext>`.

**Effective visibility:** `is_active = true AND current_date <= valid_until`.
The status view computes this live; the daily job (`expire_qr_codes`) stamps
`expired_at` for a persisted record, which is what you described as
"mark it as deactivated."

### Security model
- `qr_codes` / `scan_events` RLS: only active app users (admin **or** manager).
- Public viewer never uses RLS — it runs with the service role and only ever
  returns one file when valid. The table stays fully private to the anon key.
- User creation / password reset use `supabase.auth.admin.*` with the service
  role, **server-side only** (`/api/users`). The service role key is never
  shipped to the browser.

---

## 5. Routes

```
/login                         Sign in (client)
/generate        (app)         Generate QR
/qrcodes         (app)         List + filters
/analytics       (app)         KPIs
/users           (app, admin)  User management
/q/[slug]        PUBLIC        Scan destination (image/PDF viewer)

POST   /api/qr                 create QR (upload + row)
PATCH  /api/qr/[id]            toggle active / edit validity / title
DELETE /api/qr/[id]            delete QR + file
GET    /api/users              list users        (admin)
POST   /api/users              create user       (admin)
PATCH  /api/users/[id]         reset pw / role / enable-disable (admin)
GET    /api/cron/expire        daily expiry stamp (Bearer CRON_SECRET)
```

## 6. Environment variables — see `.env.example`
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `SIGNED_URL_TTL`,
`CRON_SECRET`.

## 7. Decisions (resolved)
- **File size cap** — **4 MB**, enforced in `/api/qr` (server) and the Generate
  form (client). Kept under Vercel's ~4.5 MB serverless function body limit —
  a 5 MB app-level cap let files through that Vercel itself then rejected
  with a raw `FUNCTION_PAYLOAD_TOO_LARGE` error.
- **Editable file** — **no replace-file action.** A QR's document is fixed at
  creation. (Still in the backlog if it's ever needed.)
- **Deactivate / delete rights** — **admin only.** Managers can generate,
  download, list, filter, and view analytics, but cannot activate/deactivate or
  delete a QR. Enforced server-side (`/api/qr/[id]`), in RLS (`qr_delete` →
  `is_admin()`), and hidden in the list UI for managers.
- **Per-file naming** — each upload takes a **Title** (required) and an optional
  **Description** ("what the file is about").
