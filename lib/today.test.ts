import { describe, expect, it } from "vitest";
import type { DrugSchedule } from "./schedule";
import {
  DUE_WINDOW_MINUTES,
  addDays,
  buildToday,
  doseKey,
  doseStatus,
  formatTime,
  localDate,
} from "./today";

const TZ = "Asia/Manila"; // UTC+8, no DST

const drug = (id: string, over: Partial<DrugSchedule> = {}): DrugSchedule => ({
  id,
  interval_hours: 4,
  day_start: "08:00:00", // the database sends HH:MM:SS
  day_end: "20:00:00",
  ...over,
});

// Local Manila time on 2026-10-28 -> UTC instant.
const at = (hhmm: string, date = "2026-10-28") =>
  new Date(`${date}T${hhmm}:00+08:00`);

describe("localDate / addDays", () => {
  it("uses the family's time zone, not UTC", () => {
    // 17:00 UTC on the 28th is already 01:00 on the 29th in Manila.
    expect(localDate(new Date("2026-10-28T17:00:00Z"), TZ)).toBe("2026-10-29");
    expect(localDate(new Date("2026-10-28T15:59:00Z"), TZ)).toBe("2026-10-28");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("doseStatus", () => {
  const dose = at("12:00");
  it("is upcoming before the dose time", () => {
    expect(doseStatus(dose, at("11:59"), false)).toBe("upcoming");
  });
  it("is due from the dose time until the due window ends", () => {
    expect(doseStatus(dose, at("12:00"), false)).toBe("due");
    expect(doseStatus(dose, at("12:30"), false)).toBe("due");
  });
  it("is overdue after the due window", () => {
    expect(DUE_WINDOW_MINUTES).toBe(30);
    expect(doseStatus(dose, at("12:31"), false)).toBe("overdue");
  });
  it("is done whenever it was given, however late", () => {
    expect(doseStatus(dose, at("18:00"), true)).toBe("done");
    expect(doseStatus(dose, at("11:00"), true)).toBe("done");
  });
});

describe("buildToday", () => {
  it("lists today's doses in time order with a status each", () => {
    const view = buildToday([drug("a")], at("12:10"), TZ);
    expect(view.doses.map((d) => d.status)).toEqual([
      "overdue", // 08:00
      "due", //     12:00
      "upcoming", //16:00
      "upcoming", //20:00
    ]);
  });

  it("makes the next dose the first one not done", () => {
    const view = buildToday([drug("a")], at("12:10"), TZ);
    expect(view.next?.scheduled_at).toEqual(at("08:00"));
    expect(view.nextIsTomorrow).toBe(false);
  });

  it("skips doses that were given", () => {
    const given = new Set([doseKey("a", at("08:00"))]);
    const view = buildToday([drug("a")], at("12:10"), TZ, given);
    expect(view.doses[0].status).toBe("done");
    expect(view.next?.scheduled_at).toEqual(at("12:00"));
  });

  it("orders doses of different drops by time", () => {
    const view = buildToday(
      [drug("a"), drug("b", { day_start: "09:00:00", day_end: "21:00:00" })],
      at("07:00"),
      TZ,
    );
    expect(view.doses.slice(0, 3).map((d) => d.drop_id)).toEqual(["a", "b", "a"]);
  });

  it("shows tomorrow's first dose once today is finished", () => {
    const all = new Set(
      [8, 12, 16, 20].map((h) => doseKey("a", at(String(h).padStart(2, "0") + ":00"))),
    );
    const view = buildToday([drug("a")], at("20:05"), TZ, all);
    expect(view.nextIsTomorrow).toBe(true);
    expect(view.next?.scheduled_at).toEqual(at("08:00", "2026-10-29"));
    expect(view.next?.status).toBe("upcoming");
  });

  it("shows tomorrow's first dose when today has no doses left in its window", () => {
    // Window is 08:00-20:00 and the day is over, nothing given yet today.
    const view = buildToday([drug("a")], at("23:00"), TZ, new Set(
      [8, 12, 16, 20].map((h) => doseKey("a", at(String(h).padStart(2, "0") + ":00"))),
    ));
    expect(view.nextIsTomorrow).toBe(true);
  });

  it("has no next dose and no doses when there are no drops", () => {
    expect(buildToday([], at("12:00"), TZ)).toEqual({
      doses: [],
      next: null,
      nextIsTomorrow: false,
    });
  });

  it("uses the local date for 'today' across the UTC boundary", () => {
    // 01:00 on the 29th in Manila is still the 28th in UTC.
    const view = buildToday([drug("a")], new Date("2026-10-28T17:00:00Z"), TZ);
    expect(view.doses[0].scheduled_at).toEqual(at("08:00", "2026-10-29"));
  });
});

describe("formatTime", () => {
  it("formats in the family's time zone", () => {
    expect(formatTime(at("08:00"), TZ)).toBe("8:00 AM");
    expect(formatTime(at("20:30"), TZ)).toBe("8:30 PM");
  });
});
