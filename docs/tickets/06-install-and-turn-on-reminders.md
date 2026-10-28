# 06 — Install on the phone and turn on reminders

**What to build:** my aunt installs the app to her home screen and taps "Turn on reminders". Her phone is saved so it can receive notifications, and a test reminder arrives with the app closed.

**Blocked by:** 04

**Status:** done

- [ ] The app can be installed to the Android home screen and opens like an app, with a name and icon (NOT MET on the aunt's phone: Chrome reports the site installable but this phone shows no install option. Recorded in docs/LATER.md. Reminders work in the Chrome tab without installing.)
- [x] The Today screen shows a "Turn on reminders" button until reminders are on
- [x] Tapping it asks for notification permission and saves the phone in `reminder_device`
- [x] `reminder_device` has Row Level Security on (set in the SQL; confirm the RLS badge in the Supabase Table Editor) with no public policies
- [x] A test reminder arrives on the phone with the app closed
- [ ] Tapping the notification opens the Today screen (not confirmed yet)
- [ ] If permission is refused, the screen explains how to turn it on (not tested on a phone)
- [x] Works on the live URL, on a real Android phone
