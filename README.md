# IRSCLASS

Upload an image or PDF → get a QR. Scanning shows the document until it's
deactivated or its validity date passes. Role-based (admin / manager).

- **Architecture, decisions, data model:** [`SPEC.md`](./SPEC.md)
- **Build plan:** [`DEVELOPMENT_PLAN.md`](./DEVELOPMENT_PLAN.md)
- **Database:** [`supabase/schema.sql`](./supabase/schema.sql)

## Local setup

```bash
npm install
cp .env.example .env.local          # fill in Supabase keys + secrets
npm run dev                         # http://localhost:3000
```

### Supabase (account: irsclass7@gmail.com)
1. Create a new project. Copy the URL, anon key, and service-role key into
   `.env.local`.
2. SQL Editor → paste and run `supabase/schema.sql`.
3. Confirm the `qr-files` bucket exists and is **private**.
4. **First admin:** Authentication → Users → Add user (`irsclass7@gmail.com` +
   password, confirm). Then run the bootstrap block at the bottom of
   `schema.sql` to promote it to admin.
5. Sign in at `/login`. Create more users from **User Management**.

## Deploy (Vercel)
Set the same env vars in the Vercel project. Set `NEXT_PUBLIC_APP_URL` to the
production domain **before** generating production QRs (the QR encodes it). The
daily expiry cron is configured in `vercel.json`; add the `CRON_SECRET` bearer
in the Vercel cron settings.

> Standalone project. Nothing here touches your existing Supabase projects or
> local apps.
