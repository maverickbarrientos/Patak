-- 005 — schedule the reminder sender to run every minute.
--
-- Run this ONLY AFTER the app with /api/send-reminders is deployed and the
-- REMINDER_CRON_SECRET setting exists in Vercel.
--
-- Before you run it, replace the placeholder text in the Authorization line
-- below (the only place it appears) with the value of REMINDER_CRON_SECRET
-- from your .env.local.
-- NEVER commit this file with the real secret in it.
--
-- pg_cron wakes up every minute and uses pg_net to POST to the app. The app
-- ignores any request that does not carry the secret.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'patak-send-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://patak-eye.vercel.app/api/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer PASTE_REMINDER_CRON_SECRET_HERE'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);

-- To stop the reminders at any time, run:
--   select cron.unschedule('patak-send-reminders');
