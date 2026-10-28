# Patak

A private PWA that tells my aunt which eye drop is next for my grandmother's right eye, and reminds her when a dose is due. Read `docs/PROBLEM.md` for the why, `docs/SPEC.md` for what to build, and `docs/tickets/` for the order. Ideas we left out are in `docs/LATER.md`.

@AGENTS.md

## Stack (pinned)
- Next.js (App Router, no `src/` folder), React, TypeScript
- Tailwind CSS 4 and shadcn for UI. Reuse the components in `components/ui/` and add new ones with the shadcn CLI.
- Supabase Postgres for data only. No Supabase Auth, no accounts, no passcode.
- Vercel for hosting. The live URL is the only way to prove a ticket.
- `web-push` for reminders, with a service worker for the PWA.
- vitest for tests. `npm test` must pass.

Do not add any other library, framework or service without asking first.

## Rules
- Drop, dose, interval and day window mean what `docs/PROBLEM.md` says in its glossary. Use those words in the code and the UI.
- The app is for one right eye and one aunt on Android. Do not build for other cases.
- Store only drop names, the eye and times. Never store personal or medical details. The app never recommends or changes a dose.
- Scheduling and gap logic stays in `lib/schedule.ts` as pure functions with tests. Reuse it. Do not copy it into components.
- Database changes go in numbered SQL files under `supabase/sql/`, for example `002-create-dose-log.sql`. Every new table enables Row Level Security in the same file.
- Run `npm run build` before every commit. It is what Vercel runs.
- Never commit `.env.local` or any real secret. Never put a secret in a `NEXT_PUBLIC_` variable.

## Allowed exceptions
- **The Supabase `service_role` key is allowed, on the server only.** There is no login, so tables have Row Level Security on with no public policies, and only the app's own server code and the reminder sender touch them. Never use the key in browser code, never in the repo, and never in a `NEXT_PUBLIC_` variable.
- **`web-push`, the service worker and a scheduled reminder sender** are part of the stack even though they sit outside the usual template.
- The reminder sender is protected by a server-side secret. A call without it must do nothing.

## Timezone
Doses are worked out in the family's local time zone, set once as a server setting. Never use the phone's or server's own time zone.
