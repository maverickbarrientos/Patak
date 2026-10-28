# Patak

## Who
My aunt, the caregiver for my grandmother, using her own Android phone.

## The struggle
After the cataract surgery, my grandmother takes 3 or 4 eye drops in her right eye, and each drop has its own interval. I have watched my aunt do it. The hard part is keeping track of which drop is next. Nothing has been missed yet, so this is about preventing it.

## Today's workaround
Pen and paper. My aunt checks the chart and the clock herself, and works out which drop is next each time.

## The MVP
The home screen shows "Next: [drop], right eye, due at [time]" with a big Given button, plus the rest of today's doses and a reminder when a dose is due, even when the app is closed.

How the schedule works: each drop has a name, an interval in hours, a daily start time and a daily end time. Doses fall at the start time and then every interval until the end time. A late dose does not shift the rest of the day. There is no course end date, so it runs until we stop it. The real names and intervals are typed into the app, not hard-coded.

How reminders work: a small free online service sends them, so they arrive with the app closed. It holds only the schedule and my aunt's phone address for notifications, with no accounts and no passcode. The app is only an unlisted link that my aunt and I know.

## How we'll know it worked
My aunt uses only the app for one full day, with no paper chart. Nothing is missed or doubled, and reminders arrive with the app closed. The demo moment is a dose due in 2 minutes and the reminder appearing on her phone.

Limits: the app stores only drop names, the eye and times. It never recommends or changes a dose.

## Out of scope
- Login and accounts
- Syncing and a second phone view
- A shared history log
- Tapering schedules and course end dates
- A wait gap between drops, unless the doctor requires one

## Glossary
- **Drop**: one eye drop medication (the bottle).
- **Dose**: one scheduled application of a drop at a specific time.
- **Interval**: the hours between doses of one drop.
- **Day window**: the start and end time within which a drop's doses happen each day.
