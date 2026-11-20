ALTER TABLE public.households
  ADD COLUMN location_label text,
  ADD COLUMN place_id text,
  ADD COLUMN units text NOT NULL DEFAULT 'us',
  ADD COLUMN weather jsonb,
  ADD COLUMN weather_at timestamptz;