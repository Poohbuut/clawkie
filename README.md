# Clawsette & Cookie Cart (Next.js + Tailwind)

## Setup
```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev                  # http://localhost:3000
```

## Where things moved
| Before | Now |
|---|---|
| `backend/app.py` (Flask) | `src/app/api/*/route.ts` + `src/lib/*` |
| `frontend/js/booking.js` | `src/components/BookingForm.tsx` |
| `frontend/js/order.js` + `index.html` | `src/components/OrderForm.tsx` + `src/app/cookies/page.tsx` |
| `style.css`, `cookie-order.css` | `tailwind.config.ts` + utility classes |
| `requirements.txt`, `.env` | `package.json`, `.env.local` |

## Behavior changes
- Cookie menu and nail services are read from the Supabase `services` table (real ids and prices), replacing the hardcoded `COOKIE_MENU`.
- Orders send `{ service_id, qty }` and `order_date`, which the API now accepts (this was the mismatch in the Flask version).
- Pick-up/delivery method and time are saved in `special_instructions` because `cookie_orders` has no columns for them.
- `GET /api/nail-slots?date=` disables already-booked times in the calendar.
- Photo filenames are sanitized and file type/size are checked server-side.

## Database
Run `supabase/migrations/20261010_inspiration_upload_limits.sql` in the Supabase
SQL editor to create or configure the public inspiration-photo bucket, including
its 8 MB limit and allowed image MIME types. Anyone with an image URL can view
photos in this public bucket.

Create an email/password user in Supabase Authentication, then promote it to
admin by running this query with that user's email:

```sql
insert into public.users (id, role, full_name, email)
select id, 'admin', coalesce(raw_user_meta_data->>'full_name', 'Admin'), email
from auth.users
where lower(email) = lower('admin@example.com')
on conflict (id) do update set role = 'admin';
```

Sign in at `/owner-access` and enroll an authenticator the first time. Admin
pages and APIs require a verified TOTP factor (AAL2). Configure the Supabase
values from `.env.example`; only `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.

## Email
App-generated booking and order alerts use `src/lib/email.ts` and SendGrid's
Mail Send API. Set `SENDGRID_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`,
and `OWNER_EMAIL` in your local environment and deployment environment. Delivery
is skipped if the API key or sender address is missing, and email failures do
not fail a saved booking or order.

Configure the sender in SendGrid and enable custom SMTP in Supabase Auth with
host `smtp.sendgrid.net`, port `587`, username `apikey`, and the SendGrid API key
as the password. Authenticate the sender/domain in SendGrid first. In Supabase,
use the contents of `supabase/templates/confirm-signup.html` for Confirm signup
and `magic-link.html` for Magic Link; both display `{{ .Token }}` for the code
entry flow. Use `reset-password.html` for Reset Password and
`change-email.html` for Change Email Address. Set email OTP length to six and
choose a suitable expiry. Set the Supabase Site URL to the deployed app URL.

These Supabase and SendGrid dashboard changes, API-key creation, sender/domain
verification, Vercel environment variables, and live email-delivery tests must
be completed manually. The app currently has no email-change screen; with
secure email changes enabled, Supabase requires confirmation at both addresses.

## Deploy
Push to GitHub and import into Vercel; configure the required variables from `.env.example`.
