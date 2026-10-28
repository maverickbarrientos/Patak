# Spec: Patak

## Problem
My grandmother takes 3 or 4 eye drops in her right eye after cataract surgery, and each drop has its own interval. My aunt, her caregiver, tracks them on paper and finds it hard to keep track of which drop is next. A missed or doubled dose is easy to make.

## Solution
Patak shows my aunt exactly one thing first: the next drop, which eye, and when it is due, with a big Given button. It lists the rest of today's doses and sends a reminder when a dose is due, even when the app is closed. She stops working out the order herself.

## The user
My aunt, the caregiver, on her own Android phone. I only look at it in person, on her phone or by opening the same link.

## User stories
1. As my aunt, I want to see which drop is next and when, so that I never have to work out the order myself.
2. As my aunt, I want to tap Given when I have put a drop in, so that the app knows it is done and moves on to the next one.
3. As my aunt, I want a reminder on my phone when a dose is due, so that I do not miss it even when the app is closed.
4. As my aunt, I want to see today's doses marked done, due now, overdue or coming up, so that I can tell at a glance where we are in the day.
5. As my aunt, I want to undo a Given tap, so that a mis-tap does not hide a dose that was not given.
6. As the family, we want to add, edit and pause a drop with its interval and daily start and end times, so that the schedule matches the doctor's instructions without changing the app.

## Screens
1. **Today (home):** a big card reading "Next: [drop], right eye, due at [time]" with a large Given button. Below it, today's doses in order, each marked done, due now, overdue or coming up, where tapping a done dose undoes it. A "Turn on reminders" button appears until reminders are on. After the last dose of the day, the card shows tomorrow's first dose.
2. **Drops:** the list of drops with add, edit and pause. Each drop has a name, an interval in hours, a daily start time and a daily end time.

## Data
All tables have Row Level Security on and no policies for the public, so the browser can never read or write them directly. Only the app's own server can, and the reminder sender reads them. There is no passcode, and the app is an unlisted link.

- **drops**: name, eye (always "right" for now), interval in hours, daily start time, daily end time, and whether it is active. Only the app's server may read or write.
- **dose_log**: only doses that were given. Which drop, the scheduled time of the dose, and when it was marked given. One row per drop and scheduled time, so a dose cannot be logged twice. Only the app's server may read or write.
- **reminder_device**: my aunt's phone's notification address and keys. Only the app's server may read or write.

Upcoming doses are worked out from the drops and are not stored. The time zone lives in server settings, not in a table.

## Login
No accounts and no passcode. The app is an unlisted link that only my aunt and I know. The reminder sender is protected by a server-side secret so outsiders cannot trigger it.

## Done for the demo
- [ ] The app opens on a phone from the live URL and can be installed to the home screen.
- [ ] I can add three or four drops with their intervals and daily start and end times.
- [ ] The Today screen shows the right "Next" drop and time, and the day's list is in the right order.
- [ ] Tapping Given marks the dose done and the card moves to the next dose, and tapping a done dose undoes it.
- [ ] A dose due in 2 minutes produces a reminder on the phone with the app closed.
- [ ] My aunt uses only the app for one full day, with nothing missed or doubled.

## Out of scope
- Login, accounts and any passcode
- Syncing and a second phone view
- A shared history log
- Tapering schedules and course end dates
- A wait gap between drops, unless the doctor requires one
