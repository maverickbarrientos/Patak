import { describe, expect, it } from "vitest";
import { isAuthorized } from "./cron-auth";
import {
  REMINDER_REPEAT_MINUTES,
  REMINDER_TAG,
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
    expect(due.map((x) => x.status)).toEqual(["due"]);
    expect(due[0].scheduled_at).toEqual(at("12:00"));
  });

  it("does not remind for a dose that is only coming up", () => {
    expect(dosesToRemind([drug("a")], at("07:59"), TZ)).toEqual([]);
    const due = dosesToRemind([drug("a")], at("11:59"), TZ);
    expect(due.map((x) => x.scheduled_at)).toEqual([at("08:00")]);
  });

  it("reminds for an overdue dose that was never given", () => {
    const due = dosesToRemind([drug("a")], at("12:40"), TZ);
    expect(due.map((x) => x.status)).toEqual(["overdue"]);
  });

  it("reminds only about the latest dose of a drop, never the older missed ones", () => {
    // 08:00 and 12:00 were never given; at 16:10 only the 16:00 dose counts.
    const due = dosesToRemind([drug("a")], at("16:10"), TZ);
    expect(due).toHaveLength(1);
    expect(due[0].scheduled_at).toEqual(at("16:00"));
  });

  it("stays quiet when the latest dose is given, even if older ones were not", () => {
    const given = new Set([doseKey("a", at("12:00"))]); // 08:00 was never marked
    expect(dosesToRemind([drug("a")], at("12:40"), TZ, given)).toEqual([]);
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
    expect(dosesToRemind([drug("a")], at("20:00"), TZ)).toHaveLength(1);
    expect(dosesToRemind([drug("a")], at("20:01"), TZ)).toEqual([]);
    expect(dosesToRemind([drug("a")], at("23:00"), TZ)).toEqual([]);
  });

  it("handles each drop's own window", () => {
    const evening = drug("b", { day_start: "18:30:00", day_end: "20:30:00" });
    const due = dosesToRemind([drug("a"), evening], at("18:35"), TZ);
    expect(due.filter((x) => x.drop_id === "b")).toHaveLength(1);
    expect(dosesToRemind([evening], at("18:29"), TZ)).toEqual([]);
  });

  it("gives one dose per drop for a full real-life day, not dozens", () => {
    // The real schedule, evening, nothing marked given all day. The old rule
    // would have sent 29 notifications here.
    const day = [
      drug("Milflox", { interval_hours: 3, day_start: "05:00:00", day_end: "20:00:00" }),
      drug("Diquas", { interval_hours: 3, day_start: "18:00:00", day_end: "21:00:00" }),
      drug("PREDFORTE", { interval_hours: 2, day_start: "07:00:00", day_end: "21:00:00" }),
      drug("LACRIFRESH", { interval_hours: 1, day_start: "08:00:00", day_end: "20:00:00" }),
      drug("SOLINE 5", { interval_hours: 2, day_start: "07:30:00", day_end: "21:30:00" }),
    ];
    const due = dosesToRemind(day, at("18:47"), TZ);
    expect(due).toHaveLength(5);
    expect(new Set(due.map((x) => x.drop_id)).size).toBe(5);
  });
});

describe("reminderMessage", () => {
  const diquas = { name: "Diquas", eye: "right" };
  const item = (
    drop: { name: string; eye: string },
    status: "due" | "overdue" = "due",
  ) => ({
    drop,
    dose: {
      key: doseKey(drop.name, at("18:30")),
      drop_id: drop.name,
      scheduled_at: at("18:30"),
      status,
    },
  });

  it("names the drop, the eye and the time for a due dose", () => {
    const m = reminderMessage([item(diquas)], TZ);
    expect(m.title).toBe("Time for Diquas");
    expect(m.body).toBe("Right eye, due at 6:30 PM");
  });

  it("says overdue for an overdue dose", () => {
    const m = reminderMessage([item(diquas, "overdue")], TZ);
    expect(m.title).toBe("Diquas is overdue");
    expect(m.body).toBe("Right eye, was due at 6:30 PM");
  });

  it("combines several due drops into one notification", () => {
    const m = reminderMessage(
      [item(diquas), item({ name: "Milflox", eye: "right" })],
      TZ,
    );
    expect(m.title).toBe("2 drops are due");
    expect(m.body).toBe("Diquas and Milflox. Right eye.");
  });

  it("shortens a long list of drops", () => {
    const names = ["A", "B", "C", "D", "E"];
    const m = reminderMessage(names.map((name) => item({ name, eye: "right" })), TZ);
    expect(m.title).toBe("5 drops are due");
    expect(m.body).toBe("A, B, C and 2 more. Right eye.");
  });

  it("uses one shared tag so a new reminder replaces the old one", () => {
    const single = reminderMessage([item(diquas)], TZ).tag;
    const overdue = reminderMessage([item(diquas, "overdue")], TZ).tag;
    const many = reminderMessage([item(diquas), item({ name: "B", eye: "right" })], TZ).tag;
    expect(new Set([single, overdue, many, REMINDER_TAG]).size).toBe(1);
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
