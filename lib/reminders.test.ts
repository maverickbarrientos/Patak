import { describe, expect, it } from "vitest";
import { isAuthorized } from "./cron-auth";
import {
  REMINDER_REPEAT_MINUTES,
  dosesToRemind,
  reminderMessage,
  withinDayWindow,
} from "./reminders";
import type { DrugSchedule } from "./schedule";
import { doseKey } from "./today";

const TZ = "Asia/Manila"; // UTC+8, no DST

const drug = (id: string, over: Partial<DrugSchedule> = {}): DrugSchedule => ({
  id,
  interval_hours: 4,
  day_start: "08:00:00",
  day_end: "20:00:00",
  ...over,
});

// Local Manila time on 2026-10-28 (plus optional seconds) -> UTC instant.
const at = (hhmm: string, seconds = "00") =>
  new Date(`2026-10-28T${hhmm}:${seconds}+08:00`);

describe("withinDayWindow", () => {
  const d = drug("a");
  it("is true from the first dose time to the last, inclusive", () => {
    expect(withinDayWindow(d, at("08:00"), TZ)).toBe(true);
    expect(withinDayWindow(d, at("14:00"), TZ)).toBe(true);
    expect(withinDayWindow(d, at("20:00"), TZ)).toBe(true);
  });
  it("still counts the whole last minute", () => {
    expect(withinDayWindow(d, at("20:00", "45"), TZ)).toBe(true);
  });
  it("is false before the start and after the end", () => {
    expect(withinDayWindow(d, at("07:59"), TZ)).toBe(false);
    expect(withinDayWindow(d, at("20:01"), TZ)).toBe(false);
    expect(withinDayWindow(d, at("23:30"), TZ)).toBe(false);
  });
});

describe("dosesToRemind", () => {
  it("reminds for a dose that is due now", () => {
    const due = dosesToRemind([drug("a")], at("12:05"), TZ);
    expect(due.map((x) => x.status)).toEqual(["overdue", "due"]); // 08:00 still not given, 12:00 due
    expect(due.at(-1)!.scheduled_at).toEqual(at("12:00"));
  });

  it("does not remind for a dose that is only coming up", () => {
    expect(dosesToRemind([drug("a")], at("07:59"), TZ)).toEqual([]);
    const due = dosesToRemind([drug("a")], at("11:59"), TZ);
    expect(due.map((x) => x.scheduled_at)).toEqual([at("08:00")]);
  });

  it("reminds for an overdue dose that was never given", () => {
    const due = dosesToRemind([drug("a")], at("12:40"), TZ);
    expect(due.map((x) => x.status)).toEqual(["overdue", "overdue"]);
  });

  it("stops reminding once a dose is given", () => {
    const given = new Set([doseKey("a", at("08:00")), doseKey("a", at("12:00"))]);
    expect(dosesToRemind([drug("a")], at("12:40"), TZ, given)).toEqual([]);
  });

  it("only drops that are passed in are reminded, so a paused drop sends none", () => {
    // The caller passes active drops only; with none, nothing is due.
    expect(dosesToRemind([], at("12:05"), TZ)).toEqual([]);
  });

  it("sends nothing outside the drop's daily window", () => {
    // The 20:00 dose is the last. At 20:01 and later its reminders stop.
    expect(dosesToRemind([drug("a")], at("20:00"), TZ).length).toBeGreaterThan(0);
    expect(dosesToRemind([drug("a")], at("20:01"), TZ)).toEqual([]);
    expect(dosesToRemind([drug("a")], at("23:00"), TZ)).toEqual([]);
  });

  it("handles each drop's own window", () => {
    const evening = drug("b", { day_start: "18:30:00", day_end: "20:30:00" });
    const due = dosesToRemind([drug("a"), evening], at("18:35"), TZ);
    expect(due.filter((x) => x.drop_id === "b")).toHaveLength(1);
    expect(dosesToRemind([evening], at("18:29"), TZ)).toEqual([]);
  });
});

describe("reminderMessage", () => {
  const drop = { name: "Diquas", eye: "right" };
  const dose = (status: "due" | "overdue") => ({
    key: doseKey("a", at("18:30")),
    drop_id: "a",
    scheduled_at: at("18:30"),
    status,
  });

  it("names the drop, the eye and the time for a due dose", () => {
    const m = reminderMessage(drop, dose("due"), TZ);
    expect(m.title).toBe("Time for Diquas");
    expect(m.body).toBe("Right eye, due at 6:30 PM");
  });

  it("says overdue for an overdue dose", () => {
    const m = reminderMessage(drop, dose("overdue"), TZ);
    expect(m.title).toBe("Diquas is overdue");
    expect(m.body).toBe("Right eye, was due at 6:30 PM");
  });

  it("uses one tag per dose so repeats replace the old notification", () => {
    expect(reminderMessage(drop, dose("due"), TZ).tag).toBe(
      reminderMessage(drop, dose("overdue"), TZ).tag,
    );
  });
});

describe("isAuthorized", () => {
  const secret = "a-long-enough-secret-value-1234";
  it("accepts the right bearer secret", () => {
    expect(isAuthorized(`Bearer ${secret}`, secret)).toBe(true);
  });
  it("rejects a missing or wrong header", () => {
    expect(isAuthorized(null, secret)).toBe(false);
    expect(isAuthorized("", secret)).toBe(false);
    expect(isAuthorized(`Bearer nope`, secret)).toBe(false);
    expect(isAuthorized(secret, secret)).toBe(false); // no "Bearer "
  });
  it("never authorises when the secret is unset or too short", () => {
    expect(isAuthorized("Bearer ", "")).toBe(false);
    expect(isAuthorized("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorized("Bearer short", "short")).toBe(false);
  });
});

describe("repeat interval", () => {
  it("is 10 minutes, as the ticket says", () => {
    expect(REMINDER_REPEAT_MINUTES).toBe(10);
  });
});
