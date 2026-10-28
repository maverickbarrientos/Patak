import type { DrugSchedule } from "./schedule";
import { buildToday, formatTime, type Dose } from "./today";

// An overdue dose that is still not given reminds again this often.
export const REMINDER_REPEAT_MINUTES = 10;

export type ReminderMessage = {
  title: string;
  body: string;
  tag: string; // same tag = the new notification replaces the old one
  url: string;
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function localMinuteOfDay(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return get("hour") * 60 + get("minute");
}

/**
 * Is `now` inside the drop's daily start and end times? Compared by the
 * minute, so a dose at the very end of the window is still reminded even if
 * the sender runs a few seconds into that minute.
 */
export function withinDayWindow(
  drug: Pick<DrugSchedule, "day_start" | "day_end">,
  now: Date,
  tz: string,
): boolean {
  const minute = localMinuteOfDay(now, tz);
  return minute >= toMinutes(drug.day_start) && minute <= toMinutes(drug.day_end);
}

// Every reminder shares this tag, so only one Patak reminder is ever on screen:
// a new one replaces the old one instead of piling up.
export const REMINDER_TAG = "patak-due";

/**
 * The doses to be reminded about right now. For each drop that is only its
 * most recent dose, and only if that dose is due or overdue (not given) and
 * the drop is inside its daily window. Older doses that were never marked
 * given still show as overdue on screen, but they stop sending reminders:
 * once the next dose is due, that is the one that matters. Whether a reminder
 * was already sent recently is tracked separately.
 */
export function dosesToRemind(
  drugs: DrugSchedule[],
  now: Date,
  tz: string,
  done: ReadonlySet<string> = new Set(),
): Dose[] {
  const byId = new Map(drugs.map((d) => [d.id, d]));

  // doses are in time order, so the last one seen per drop is the latest
  const latest = new Map<string, Dose>();
  for (const dose of buildToday(drugs, now, tz, done).doses) {
    if (dose.status !== "upcoming") latest.set(dose.drop_id, dose);
  }

  return [...latest.values()].filter(
    (dose) =>
      (dose.status === "due" || dose.status === "overdue") &&
      withinDayWindow(byId.get(dose.drop_id)!, now, tz),
  );
}

const eyeLabel = (eye: string) =>
  `${eye.charAt(0).toUpperCase()}${eye.slice(1)} eye`;

// "A", "A and B", "A, B and C", "A, B, C and 2 more"
function joinNames(names: string[]): string {
  const MAX = 3;
  if (names.length === 1) return names[0];
  if (names.length <= MAX) {
    return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  }
  const more = names.length - MAX;
  return `${names.slice(0, MAX).join(", ")} and ${more} more`;
}

/**
 * One notification for everything that is due: the single drop by name, or a
 * combined message when several are due at once.
 */
export function reminderMessage(
  items: { drop: { name: string; eye: string }; dose: Dose }[],
  tz: string,
): ReminderMessage {
  if (items.length === 1) {
    const { drop, dose } = items[0];
    const time = formatTime(dose.scheduled_at, tz);
    return dose.status === "overdue"
      ? {
          title: `${drop.name} is overdue`,
          body: `${eyeLabel(drop.eye)}, was due at ${time}`,
          tag: REMINDER_TAG,
          url: "/",
        }
      : {
          title: `Time for ${drop.name}`,
          body: `${eyeLabel(drop.eye)}, due at ${time}`,
          tag: REMINDER_TAG,
          url: "/",
        };
  }

  const eyes = [...new Set(items.map((i) => eyeLabel(i.drop.eye)))];
  return {
    title: `${items.length} drops are due`,
    body: `${joinNames(items.map((i) => i.drop.name))}. ${eyes.join(" and ")}.`,
    tag: REMINDER_TAG,
    url: "/",
  };
}
