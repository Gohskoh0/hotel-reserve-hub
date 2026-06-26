
-- Enums
CREATE TYPE public.payment_option AS ENUM ('full', 'deposit', 'none');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'deposit_paid', 'paid', 'refunded');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Admin users
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- No policies = no anon/authenticated access; only service_role (server functions) can read/write.

-- Hotel settings (singleton)
CREATE TABLE public.hotel_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Lakewood Hotel',
  tagline TEXT NOT NULL DEFAULT 'Lakeside calm. Effortless hospitality.',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  deposit_percent INTEGER NOT NULL DEFAULT 20 CHECK (deposit_percent BETWEEN 1 AND 99),
  currency TEXT NOT NULL DEFAULT 'NGN',
  currency_symbol TEXT NOT NULL DEFAULT '₦',
  paystack_public_key TEXT NOT NULL DEFAULT '',
  paystack_secret_key TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.hotel_settings TO service_role;
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- Room types
CREATE TABLE public.room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  price_per_night NUMERIC(12,2) NOT NULL CHECK (price_per_night >= 0),
  capacity INTEGER NOT NULL DEFAULT 2 CHECK (capacity >= 1),
  total_inventory INTEGER NOT NULL DEFAULT 1 CHECK (total_inventory >= 0),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.room_types TO service_role;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  num_guests INTEGER NOT NULL DEFAULT 1,
  num_rooms INTEGER NOT NULL DEFAULT 1 CHECK (num_rooms >= 1),
  room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE RESTRICT,
  room_type_name TEXT NOT NULL,
  price_per_night NUMERIC(12,2) NOT NULL,
  nights INTEGER NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  amount_due_now NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_option public.payment_option NOT NULL DEFAULT 'none',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  status public.booking_status NOT NULL DEFAULT 'pending',
  paystack_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX bookings_dates_idx ON public.bookings (room_type_id, check_in, check_out);
CREATE INDEX bookings_status_idx ON public.bookings (status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_users_touch BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_hotel_settings_touch BEFORE UPDATE ON public.hotel_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_room_types_touch BEFORE UPDATE ON public.room_types
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_bookings_touch BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed singleton settings row
INSERT INTO public.hotel_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
