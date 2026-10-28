# 06 — Install on the phone and turn on reminders

**What to build:** my aunt installs the app to her home screen and taps "Turn on reminders". Her phone is saved so it can receive notifications, and a test reminder arrives with the app closed.

**Blocked by:** 04

**Status:** todo

- [ ] The app can be installed to the Android home screen and opens like an app, with a name and icon
- [ ] The Today screen shows a "Turn on reminders" button until reminders are on
- [ ] Tapping it asks for notification permission and saves the phone in `reminder_device`
- [x] `reminder_device` has Row Level Security on (set in the SQL; confirm the RLS badge in the Supabase Table Editor) with no public policies
- [ ] A test reminder arrives on the phone with the app closed
- [ ] Tapping the notification opens the Today screen
- [ ] If permission is refused, the screen explains how to turn it on
- [ ] Works on the live URL, on a real Android phone
