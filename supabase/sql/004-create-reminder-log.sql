-- 004 — reminder_log: when each dose was last reminded about.
--
-- The reminder sender runs every minute. This table is how it knows a dose
-- already got its reminder, so it sends once when the dose is due and then
-- repeats only every 10 minutes while the dose is still not given.
-- One row per drop and scheduled time.
--
-- Row Level Security is ON with deliberately NO policies: the browser can
-- never read or write this table. Only the app's server (secret key) can.

create table if not exists public.reminder_log (
  drop_id      uuid not null references public.drops (id) on delete cascade,
  scheduled_at timestamptz not null,
  last_sent_at timestamptz not null,
  primary key (drop_id, scheduled_at)
);

alter table public.reminder_log enable row level security;

-- Belt and braces: take away table access from the public roles as well.
revoke all on public.reminder_log from anon, authenticated;
