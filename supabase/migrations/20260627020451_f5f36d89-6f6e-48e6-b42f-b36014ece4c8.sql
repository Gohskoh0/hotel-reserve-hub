
ALTER TABLE public.hotel_settings
  ADD COLUMN IF NOT EXISTS facebook_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS plus_code TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS checkout_time TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS star_rating INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guest_rating NUMERIC(3,1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;

UPDATE public.hotel_settings SET
  name = 'Lakewood Hotel',
  tagline = '',
  about = '',
  address = '30 Agip Link Road, Ada-George Road, LGA, Rumueme, Port Harcourt 500272, Rivers',
  phone = '0901 664 0239',
  email = '',
  facebook_url = 'https://facebook.com',
  plus_code = 'RXC9+R2 Port Harcourt',
  checkout_time = '12:00',
  star_rating = 3,
  guest_rating = 3.6,
  review_count = 434,
  currency = 'NGN',
  currency_symbol = '₦'
WHERE id = 1;
