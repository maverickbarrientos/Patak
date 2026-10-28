-- 003 — reminder_device: the phones that receive reminder notifications.
--
-- A row is the notification address the phone's browser gave us (endpoint) and
-- the two keys needed to encrypt a message for it. One row per phone.
--
-- Row Level Security is ON with deliberately NO policies: the browser can
-- never read or write this table. Only the app's server (secret key) can.

create table public.reminder_device (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

alter table public.reminder_device enable row level security;

-- Belt and braces: take away table access from the public roles as well.
revoke all on public.reminder_device from anon, authenticated;
