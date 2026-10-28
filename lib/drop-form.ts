export type DropValues = {
  name: string;
  interval_hours: number;
  day_start: string; // "HH:MM"
  day_end: string; // "HH:MM"
};

export type DropFormErrors = Partial<Record<keyof DropValues, string>>;

export type DropFormResult =
  | { ok: true; values: DropValues }
  | { ok: false; errors: DropFormErrors };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_NAME = 60;
const MAX_INTERVAL_HOURS = 24;

const field = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
};

// The database stores times as "HH:MM:SS", the form wants "HH:MM".
export const toHHMM = (t: string) => t.slice(0, 5);

/** "18:36:00" -> "6:36 PM", to match how the Today screen shows times. */
export function formatClock(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** 4 -> "every 4 hours", 1 -> "every hour", 24 -> "once a day". */
export function formatInterval(hours: number): string {
  if (hours === 24) return "once a day";
  if (hours === 1) return "every hour";
  return `every ${hours} hours`;
}

export function parseDropForm(formData: FormData): DropFormResult {
  const errors: DropFormErrors = {};

  const name = field(formData, "name");
  if (!name) errors.name = "Enter the name of the drop.";
  else if (name.length > MAX_NAME)
    errors.name = `Keep the name under ${MAX_NAME} letters.`;

  const rawInterval = field(formData, "interval_hours");
  const interval_hours = Number(rawInterval);
  if (!rawInterval || !Number.isFinite(interval_hours))
    errors.interval_hours = "Enter the hours between doses, like 4.";
  else if (interval_hours <= 0)
    errors.interval_hours = "The hours between doses must be more than 0.";
  else if (interval_hours > MAX_INTERVAL_HOURS)
    errors.interval_hours = `The hours between doses can be at most ${MAX_INTERVAL_HOURS}.`;

  const day_start = field(formData, "day_start");
  const day_end = field(formData, "day_end");
  if (!TIME.test(day_start)) errors.day_start = "Pick the first dose time.";
  if (!TIME.test(day_end)) errors.day_end = "Pick the last dose time.";
  if (!errors.day_start && !errors.day_end && day_end <= day_start)
    errors.day_end = "The last dose must be after the first dose.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, values: { name, interval_hours, day_start, day_end } };
}
