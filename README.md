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

## Deploy
Push to GitHub and import into Vercel; add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as environment variables.
# clawkie
