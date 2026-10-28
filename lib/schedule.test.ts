import { describe, expect, it } from "vitest";
import {
  checkGap,
  generateDaySchedule,
  generateSlots,
  zonedToUtc,
  type DrugSchedule,
} from "./schedule";

const TZ = "Asia/Manila"; // UTC+8, no DST

const drug = (over: Partial<DrugSchedule> = {}): DrugSchedule => ({
  id: "a",
  interval_hours: 4,
  day_start: "08:00",
  day_end: "20:00",
  start_date: "2026-10-01",
  end_date: null,
  ...over,
});

describe("zonedToUtc", () => {
  it("converts local wall-clock time to UTC", () => {
    expect(zonedToUtc("2026-10-28", 8 * 60, TZ).toISOString()).toBe(
      "2026-10-28T00:00:00.000Z",
    );
  });

  it("handles a DST zone", () => {
    // New York is UTC-4 in October (EDT).
    expect(zonedToUtc("2026-10-28", 9 * 60, "America/New_York").toISOString()).toBe(
      "2026-10-28T13:00:00.000Z",
    );
  });
});

describe("generateSlots", () => {
  it("spaces slots by interval within the day window, inclusive of day_end", () => {
    const hours = generateSlots(drug(), "2026-10-28", TZ).map(
      (d) => (d.getUTCHours() + 8) % 24,
    );
    expect(hours).toEqual([8, 12, 16, 20]);
  });

  it("applies the stagger offset", () => {
    const first = generateSlots(drug(), "2026-10-28", TZ, 5)[0];
    expect(first.toISOString()).toBe("2026-10-28T00:05:00.000Z");
  });

  it("returns nothing before start_date or after end_date", () => {
    expect(generateSlots(drug({ start_date: "2026-11-01" }), "2026-10-28", TZ)).toEqual([]);
    expect(generateSlots(drug({ end_date: "2026-10-27" }), "2026-10-28", TZ)).toEqual([]);
  });

  it("includes both boundary dates", () => {
    const d = drug({ start_date: "2026-10-28", end_date: "2026-10-28" });
    expect(generateSlots(d, "2026-10-28", TZ)).toHaveLength(4);
  });

  it("supports fractional-hour intervals", () => {
    const slots = generateSlots(drug({ interval_hours: 1.5, day_end: "11:00" }), "2026-10-28", TZ);
    expect(slots).toHaveLength(3); // 08:00, 09:30, 11:00
  });

  it("returns nothing for a non-positive interval", () => {
    expect(generateSlots(drug({ interval_hours: 0 }), "2026-10-28", TZ)).toEqual([]);
  });
});

describe("generateDaySchedule", () => {
  it("staggers drugs and sorts by time", () => {
    const out = generateDaySchedule(
      [drug({ id: "a" }), drug({ id: "b" }), drug({ id: "c" })],
      "2026-10-28",
      TZ,
      5,
    );
    expect(out.slice(0, 3).map((s) => s.drug_id)).toEqual(["a", "b", "c"]);
    expect(out[1].scheduled_at.getTime() - out[0].scheduled_at.getTime()).toBe(5 * 60_000);
    expect(out).toHaveLength(12);
  });
});

describe("checkGap", () => {
  const now = new Date("2026-10-28T00:00:00Z");
  const ago = (min: number) => new Date(now.getTime() - min * 60_000);

  it("blocks when a different drug was given inside the gap", () => {
    expect(checkGap("b", now, [{ drug_id: "a", given_at: ago(2) }], 5)).toEqual({
      ok: false,
      waitMinutes: 3,
    });
  });

  it("allows once the gap has passed", () => {
    expect(checkGap("b", now, [{ drug_id: "a", given_at: ago(5) }], 5)).toEqual({ ok: true });
  });

  it("ignores the same drug's own previous dose", () => {
    expect(checkGap("a", now, [{ drug_id: "a", given_at: ago(1) }], 5)).toEqual({ ok: true });
  });

  it("uses the longest remaining wait across drugs", () => {
    const r = checkGap(
      "c",
      now,
      [
        { drug_id: "a", given_at: ago(4) },
        { drug_id: "b", given_at: ago(1) },
      ],
      5,
    );
    expect(r).toEqual({ ok: false, waitMinutes: 4 });
  });
});
