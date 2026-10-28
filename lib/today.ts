import {
  generateDaySchedule,
  generateSlots,
  type DrugSchedule,
} from "./schedule";

// A dose counts as "due now" for this long after its time, then it is overdue.
export const DUE_WINDOW_MINUTES = 30;

export type DoseStatus = "done" | "due" | "overdue" | "upcoming";

export type Dose = {
  key: string;
  drop_id: string;
  scheduled_at: Date;
  status: DoseStatus;
};

export type TodayView = {
  doses: Dose[];
  next: Dose | null;
  nextIsTomorrow: boolean;
};

// Identifies one dose of one drop, so it can be matched to the given log.
export const doseKey = (drop_id: string, scheduled_at: Date) =>
  `${drop_id}|${scheduled_at.toISOString()}`;

/** The local calendar date "YYYY-MM-DD" at `now` in `tz`. */
export function localDate(now: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function doseStatus(
  scheduledAt: Date,
  now: Date,
  done: boolean,
): DoseStatus {
  if (done) return "done";
  const minutesLate = (now.getTime() - scheduledAt.getTime()) / 60_000;
  if (minutesLate < 0) return "upcoming";
  return minutesLate <= DUE_WINDOW_MINUTES ? "due" : "overdue";
}

/**
 * Today's doses in time order, plus the one the card should show: the first
 * dose not yet done, or tomorrow's first dose once today is finished.
 */
export function buildToday(
  drugs: DrugSchedule[],
  now: Date,
  tz: string,
  done: ReadonlySet<string> = new Set(),
): TodayView {
  const date = localDate(now, tz);
  const doses: Dose[] = generateDaySchedule(drugs, date, tz, 0).map((s) => {
    const key = doseKey(s.drug_id, s.scheduled_at);
    return {
      key,
      drop_id: s.drug_id,
      scheduled_at: s.scheduled_at,
      status: doseStatus(s.scheduled_at, now, done.has(key)),
    };
  });

  const pending = doses.find((d) => d.status !== "done");
  if (pending) return { doses, next: pending, nextIsTomorrow: false };

  const [first] = generateDaySchedule(drugs, addDays(date, 1), tz, 0);
  if (!first) return { doses, next: null, nextIsTomorrow: false };
  return {
    doses,
    nextIsTomorrow: true,
    next: {
      key: doseKey(first.drug_id, first.scheduled_at),
      drop_id: first.drug_id,
      scheduled_at: first.scheduled_at,
      status: "upcoming",
    },
  };
}

/** Is `scheduledAt` one of this drop's real dose times today? */
export function isScheduledSlot(
  drug: DrugSchedule,
  scheduledAt: Date,
  now: Date,
  tz: string,
): boolean {
  return generateSlots(drug, localDate(now, tz), tz, 0).some(
    (slot) => slot.getTime() === scheduledAt.getTime(),
  );
}

/** "8:00 AM" in the family's time zone. */
export function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
