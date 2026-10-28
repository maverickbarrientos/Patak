export type DrugSchedule = {
  id: string;
  interval_hours: number;
  day_start: string; // "HH:MM" local
  day_end: string; // "HH:MM" local, inclusive
  start_date: string; // "YYYY-MM-DD" local, inclusive
  end_date: string | null; // "YYYY-MM-DD" local, inclusive
};

export type GivenDose = { drug_id: string; given_at: Date };

export type GapResult = { ok: true } | { ok: false; waitMinutes: number };

const MS_PER_MIN = 60_000;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Offset (ms) of `tz` from UTC at the given instant.
function tzOffsetMs(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// Local wall-clock `date` + `minutes` since midnight in `tz` -> UTC instant.
export function zonedToUtc(date: string, minutes: number, tz: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, 0, minutes);
  const first = guess - tzOffsetMs(new Date(guess), tz);
  // Re-check the offset at the first result to handle DST boundaries.
  return new Date(guess - tzOffsetMs(new Date(first), tz));
}

/**
 * Dose times for one drug on one local date. `offsetMinutes` shifts the whole
 * day so different drugs don't land on the same minute.
 */
export function generateSlots(
  drug: DrugSchedule,
  date: string,
  tz: string,
  offsetMinutes = 0,
): Date[] {
  if (date < drug.start_date) return [];
  if (drug.end_date && date > drug.end_date) return [];

  const start = toMinutes(drug.day_start) + offsetMinutes;
  const end = toMinutes(drug.day_end) + offsetMinutes;
  const step = Math.round(drug.interval_hours * 60);
  if (step <= 0) return [];

  const slots: Date[] = [];
  for (let m = start; m <= end; m += step) {
    slots.push(zonedToUtc(date, m, tz));
  }
  return slots;
}

/** Slots for every drug on `date`, drug i shifted by i * gapMinutes. */
export function generateDaySchedule(
  drugs: DrugSchedule[],
  date: string,
  tz: string,
  gapMinutes: number,
): { drug_id: string; scheduled_at: Date }[] {
  return drugs
    .flatMap((drug, i) =>
      generateSlots(drug, date, tz, i * gapMinutes).map((scheduled_at) => ({
        drug_id: drug.id,
        scheduled_at,
      })),
    )
    .sort((a, b) => a.scheduled_at.getTime() - b.scheduled_at.getTime());
}

/**
 * Can `drugId` be given at `now`? Another drug given less than `gapMinutes`
 * ago means wait. The same drug is never blocked by its own previous dose.
 */
export function checkGap(
  drugId: string,
  now: Date,
  recentGiven: GivenDose[],
  gapMinutes: number,
): GapResult {
  let wait = 0;
  for (const dose of recentGiven) {
    if (dose.drug_id === drugId) continue;
    const elapsed = (now.getTime() - dose.given_at.getTime()) / MS_PER_MIN;
    if (elapsed >= 0 && elapsed < gapMinutes) {
      wait = Math.max(wait, Math.ceil(gapMinutes - elapsed));
    }
  }
  return wait > 0 ? { ok: false, waitMinutes: wait } : { ok: true };
}
