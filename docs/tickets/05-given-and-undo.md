# 05 — Given and undo

**What to build:** my aunt taps Given when she has put a drop in, the dose is marked done, and the card moves to the next dose. Tapping a done dose undoes it.

**Blocked by:** 04

**Status:** todo

- [x] The `dose_log` table exists with the drop, the scheduled time of the dose, and when it was marked given, with one row per drop and scheduled time
- [x] Row Level Security is on for `dose_log` with no public policies
- [x] Tapping Given on the Next card marks that dose done and the card moves to the next dose
- [x] A done dose shows as done in today's list and stays done after reloading
- [x] Tapping a done dose undoes it (via an Undo button on the done row) and it becomes due or overdue again
- [x] Tapping Given twice quickly does not log the dose twice
- [ ] Works on the live URL
