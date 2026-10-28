import { describe, expect, it } from "vitest";
import { formatClock, formatInterval, parseDropForm, toHHMM } from "./drop-form";

const form = (over: Record<string, string> = {}) => {
  const data = {
    name: "Antibiotic",
    interval_hours: "4",
    day_start: "08:00",
    day_end: "20:00",
    ...over,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.set(k, v);
  return fd;
};

describe("parseDropForm", () => {
  it("accepts a valid drop and returns clean values", () => {
    expect(parseDropForm(form({ name: "  Antibiotic  " }))).toEqual({
      ok: true,
      values: {
        name: "Antibiotic",
        interval_hours: 4,
        day_start: "08:00",
        day_end: "20:00",
      },
    });
  });

  it("accepts a fractional interval", () => {
    const r = parseDropForm(form({ interval_hours: "1.5" }));
    expect(r.ok && r.values.interval_hours).toBe(1.5);
  });

  it("rejects an empty or blank name", () => {
    for (const name of ["", "   "]) {
      const r = parseDropForm(form({ name }));
      expect(!r.ok && r.errors.name).toBeTruthy();
    }
  });

  it("rejects a name that is too long", () => {
    const r = parseDropForm(form({ name: "x".repeat(61) }));
    expect(!r.ok && r.errors.name).toBeTruthy();
  });

  it("rejects an interval of zero, negative, text, empty or over 24", () => {
    for (const interval_hours of ["0", "-2", "abc", "", "25"]) {
      const r = parseDropForm(form({ interval_hours }));
      expect(!r.ok && r.errors.interval_hours).toBeTruthy();
    }
  });

  it("rejects an end time that is not after the start time", () => {
    for (const day_end of ["08:00", "07:59"]) {
      const r = parseDropForm(form({ day_end }));
      expect(!r.ok && r.errors.day_end).toBeTruthy();
    }
  });

  it("rejects a missing or malformed time", () => {
    const r = parseDropForm(form({ day_start: "", day_end: "25:00" }));
    expect(!r.ok && r.errors.day_start).toBeTruthy();
    expect(!r.ok && r.errors.day_end).toBeTruthy();
  });

  it("reports every problem at once", () => {
    const r = parseDropForm(form({ name: "", interval_hours: "0" }));
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["interval_hours", "name"]);
  });
});

describe("toHHMM", () => {
  it("trims database times to HH:MM", () => {
    expect(toHHMM("08:00:00")).toBe("08:00");
  });
});

describe("formatClock", () => {
  it("shows 12-hour times like the Today screen", () => {
    expect(formatClock("18:36:00")).toBe("6:36 PM");
    expect(formatClock("08:00")).toBe("8:00 AM");
    expect(formatClock("03:05:00")).toBe("3:05 AM");
  });
  it("handles midnight and noon", () => {
    expect(formatClock("00:30:00")).toBe("12:30 AM");
    expect(formatClock("12:00:00")).toBe("12:00 PM");
    expect(formatClock("23:59:00")).toBe("11:59 PM");
  });
});

describe("formatInterval", () => {
  it("reads naturally", () => {
    expect(formatInterval(4)).toBe("every 4 hours");
    expect(formatInterval(1.5)).toBe("every 1.5 hours");
    expect(formatInterval(1)).toBe("every hour");
    expect(formatInterval(24)).toBe("once a day");
  });
});
