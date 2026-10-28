import { formatClock, formatInterval } from "@/lib/drop-form";

export type Drop = {
  id: string;
  name: string;
  eye: string;
  interval_hours: number;
  day_start: string; // "HH:MM:SS" from the database
  day_end: string;
  active: boolean;
};

export const DROP_COLUMNS =
  "id, name, eye, interval_hours, day_start, day_end, active";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string) => UUID.test(v);

/** "Right eye", with the first letter capitalised. */
export const eyeLabel = (eye: string) =>
  `${eye.charAt(0).toUpperCase()}${eye.slice(1)} eye`;

/** "every 3 hours, 3:00 AM to 9:00 PM" */
export const describeSchedule = (d: Drop) =>
  `${formatInterval(Number(d.interval_hours))}, ${formatClock(d.day_start)} to ${formatClock(d.day_end)}`;
