-- 001 — drops: the eye drop medications and when each one is given.
--
-- Row Level Security is ON and there are deliberately NO policies. That means
-- the browser (anon / authenticated keys) can never read or write this table.
-- Only the app's own server, using the server-side secret key, can touch it.

create table public.drops (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  eye         text not null default 'right' check (eye in ('right', 'left')),
  interval_hours numeric not null check (interval_hours > 0),
  day_start   time not null,
  day_end     time not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  check (day_end > day_start)
);

alter table public.drops enable row level security;

-- Belt and braces: take away table access from the public roles as well.
revoke all on public.drops from anon, authenticated;
