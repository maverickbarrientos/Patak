import { toHHMM } from "@/lib/drop-form";

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

export const describeDrop = (d: Drop) =>
  `${d.eye} eye, every ${Number(d.interval_hours)} h, ${toHHMM(d.day_start)} to ${toHHMM(d.day_end)}`;
