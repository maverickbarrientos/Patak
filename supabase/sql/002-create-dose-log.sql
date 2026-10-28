-- 002 — dose_log: which doses have been given.
--
-- Only given doses are stored. Upcoming doses are worked out from `drops`.
-- One row per drop and scheduled time, so tapping Given twice cannot log the
-- same dose twice.
--
-- Row Level Security is ON with deliberately NO policies: the browser can
-- never read or write this table. Only the app's server (secret key) can.

create table public.dose_log (
  id           uuid primary key default gen_random_uuid(),
  drop_id      uuid not null references public.drops (id) on delete cascade,
  scheduled_at timestamptz not null,
  given_at     timestamptz not null default now(),
  unique (drop_id, scheduled_at)
);

alter table public.dose_log enable row level security;

-- Belt and braces: take away table access from the public roles as well.
revoke all on public.dose_log from anon, authenticated;
