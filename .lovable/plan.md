## Lakewood Hotel — booking site + admin

I couldn't reliably pin down which Lakewood Hotel (the name exists in several countries) from search — and you asked for no demo data — so the hotel's address, phone, email and hero photo will be **fields you fill in from the admin dashboard** on first login. The site reads from there. (If you paste the Google Maps link in chat after build, I'll prefill it.)

## Public site

- **Home** — hero with hotel photo, name, tagline, CTA "Book a room", short about block, contact strip (address/phone/email pulled from settings).
- **Rooms** — list of room types with photo, description, price/night, capacity, amenities, "Book" button.
- **Booking flow** (`/book/:roomTypeId`):
  1. Pick check-in / check-out dates + guests + number of rooms.
  2. Availability check (rooms of that type not exceeding inventory for any date in range).
  3. Guest details form (name, email, phone, notes).
  4. Choose payment option (all three available per your answer):
     - Pay full now (Paystack)
     - Pay deposit now (admin-configurable %, default 20%) (Paystack)
     - Reserve without payment (status = pending, admin confirms)
  5. Confirmation page with booking reference.
- **Contact** page.

## Admin (`/admin`)

- **Login** with username + password. **Default credentials seeded on first deploy:** `admin` / `ChangeMe!2026`. A red banner forces a password change before anything else if defaults are still in use.
- **Dashboard** — bookings list (filter by status: pending/confirmed/cancelled), revenue summary, today's check-ins/outs.
- **Bookings** — view detail, mark confirmed/cancelled, see payment status.
- **Room Types** — create / edit / delete (name, description, photos, price/night, capacity, total inventory, amenities).
- **Hotel Settings** — name, tagline, address, phone, email, hero image, about text, deposit %.
- **Payments (Paystack)** — paste public + secret keys. **Write-only**: once saved, the secret key is never returned to the UI again; the form just shows "•••••• configured ✓" and a "Replace key" button. Public key may be shown (it's public by design).
- **Account** — change username & password.

## Technical details

- **Lovable Cloud** (Supabase under the hood) for DB, storage (room photos / hero), and server logic.
- **Tables**: `admin_users` (id, username, password_hash, must_change_password), `hotel_settings` (singleton row), `room_types`, `bookings`, `booking_rooms`. Paystack secret key stored as a project **secret** via add_secret (never in DB, never returned to client). Public key stored in `hotel_settings`.
- **Admin auth**: custom session via server function (password hashed with bcrypt; httpOnly encrypted cookie session). Not using Supabase Auth because you specified default-credentials flow, not signups.
- **Paystack**: initialize transaction server-side using the secret key from env; verify on callback; create booking row with `payment_status = paid | deposit_paid | unpaid` and `status = confirmed | pending`.
- **Availability**: server function computes `sum(rooms booked overlapping date range) < room_type.total_inventory` per date.
- **Brand**: lakeside warmth — deep forest green + soft cream + warm brass accents, serif display headings (Fraunces) + clean sans (Inter). No purple.

## What I won't do

- No demo bookings, no fake room types, no placeholder hotel address. The site will render empty states ("No rooms available yet — add some from the admin dashboard") until you populate via admin.

## After you approve

I'll enable Lovable Cloud, build everything end-to-end, and give you the admin URL + default credentials.
