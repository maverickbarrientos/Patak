# 07 — Real reminders when a dose is due

**What to build:** when a dose is due or overdue, my aunt's phone gets a reminder naming the drop, even when the app is closed. Doses already marked Given are skipped.

**Blocked by:** 05, 06

**Status:** todo

- [ ] A scheduled sender checks every minute for doses that are due or overdue
- [ ] A due dose sends one reminder naming the drop and "right eye"
- [ ] An overdue dose that is still not given sends a repeat reminder every 10 minutes
- [ ] A dose marked Given stops its reminders, and a paused drop sends none
- [ ] The sender is protected by a server-side secret, so calling it without the secret does nothing
- [ ] No reminder is sent outside a drop's daily start and end times
- [ ] A dose created to be due in 2 minutes produces a reminder on the phone with the app closed
- [ ] Works on the live URL, on a real Android phone
