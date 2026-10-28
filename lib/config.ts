// The family's local time zone, e.g. "Asia/Manila". Doses are worked out in
// this zone, never the phone's or the server's own.
export function getTimeZone(): string {
  const tz = process.env.TIMEZONE;
  if (!tz) throw new Error("TIMEZONE must be set");
  return tz;
}
