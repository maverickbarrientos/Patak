-- 005 — schedule the reminder sender to run every 15 seconds.
--
-- Running every 15 seconds means a due dose waits at most about 15 seconds
-- before its reminder goes out. If your project's pg_cron rejects the
-- '15 seconds' schedule, use '* * * * *' (every minute) instead.
--
-- Run this ONLY AFTER the app with /api/send-reminders is deployed and the
-- REMINDER_CRON_SECRET setting exists in Vercel.
--
-- Before you run it, replace the placeholder text in the Authorization line
-- below (the only place it appears) with the value of REMINDER_CRON_SECRET
-- from your .env.local.
-- NEVER commit this file with the real secret in it.
--
-- pg_cron wakes up on schedule and uses pg_net to POST to the app. The app
-- ignores any request that does not carry the secret, and it never sends the
-- same reminder twice, so running often is safe.
--
-- Running this again REPLACES the existing job with the same name.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'patak-send-reminders',
  '15 seconds',
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
