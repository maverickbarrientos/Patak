# 02 — Connected to Supabase

**What to build:** the live site can read the list of drops from the database through the app's own server. The browser never talks to the database directly.

**Blocked by:** 01

**Status:** todo

- [x] A Supabase project exists, and its settings are set locally AND in Vercel
- [x] The `drops` table exists with name, eye (default "right"), interval in hours, daily start time, daily end time, and active
- [x] Row Level Security is on for `drops` (set in the SQL; confirm the RLS badge in the Supabase Table Editor) with no public policies, so the browser cannot read or write it
- [x] The server key is only used on the server, never in browser code or the repo, and the exception to the "never use service_role" rule is written down in `CLAUDE.md`
- [x] The time zone is a server setting
- [ ] The live site shows the drops read from the table, including one test row
- [ ] Works on the live URL
