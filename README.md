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
For a new Supabase project, run `supabase/schema.sql` in the SQL editor. For an
existing app database, run `supabase/migrations/20261010_nail_design_catalog.sql`.
Both nail photo buckets are public, so anyone with an image URL can view photos.

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
pages and APIs require a verified TOTP factor (AAL2). Configure all four values
from `.env.example`; only `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.

## Deploy
Push to GitHub and import into Vercel; configure all four variables from `.env.example`.
