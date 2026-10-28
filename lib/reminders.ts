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

/**
 * Today's doses that should be reminded about right now: due or overdue,
 * not given, and inside their drop's daily window. Whether a reminder was
 * already sent recently is tracked separately.
 */
export function dosesToRemind(
  drugs: DrugSchedule[],
  now: Date,
  tz: string,
  done: ReadonlySet<string> = new Set(),
): Dose[] {
  const byId = new Map(drugs.map((d) => [d.id, d]));
  return buildToday(drugs, now, tz, done).doses.filter(
    (dose) =>
      (dose.status === "due" || dose.status === "overdue") &&
      withinDayWindow(byId.get(dose.drop_id)!, now, tz),
  );
}

export function reminderMessage(
  drop: { name: string; eye: string },
  dose: Dose,
  tz: string,
): ReminderMessage {
  const eye = `${drop.eye.charAt(0).toUpperCase()}${drop.eye.slice(1)} eye`;
  const time = formatTime(dose.scheduled_at, tz);
  return dose.status === "overdue"
    ? {
        title: `${drop.name} is overdue`,
        body: `${eye}, was due at ${time}`,
        tag: dose.key,
        url: "/",
      }
    : {
        title: `Time for ${drop.name}`,
        body: `${eye}, due at ${time}`,
        tag: dose.key,
        url: "/",
      };
}
