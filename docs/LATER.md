# Later

Ideas we deliberately left out of the first version.

- Login and accounts
- Syncing and a second phone view, so family can check from their own phone
- A shared history log of who gave what and when
- Tapering schedules and course end dates
- A wait gap between different drops, unless the doctor requires one (`lib/schedule.ts` already has the gap logic and tests)
- Install Patak to the home screen on my aunt's phone. Chrome reports the site as installable (manifest, icons and service worker are fine), but her phone shows no Install or Add to Home screen option. Reminders work in the Chrome tab without installing. Worth another look if the phone turns out to be managed, or if a different phone is used.
  - What we ruled out: the site is installable (Chrome on desktop installs it and reports no installability errors), the manifest, icons and service worker are served correctly, a no-op fetch handler was added, the phone's Chrome is 156.0.8078.73, the phone is not managed (chrome://management) and Patak is not already installed (chrome://webapks is empty).
  - Next step if we revisit it: connect the phone over USB with USB debugging on, open chrome://inspect on a computer, inspect the Patak tab, and read Application, Manifest, Installability for Chrome's exact reason.
