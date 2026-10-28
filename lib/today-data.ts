import "server-only";
import { getTimeZone } from "@/lib/config";
import { DROP_COLUMNS, type Drop } from "@/lib/drops";
import { zonedToUtc } from "@/lib/schedule";
import { getSupabase } from "@/lib/supabase-server";
import { addDays, doseKey, localDate } from "@/lib/today";

export type TodayData = {
  tz: string;
  drops: Drop[]; // active drops only
  givenAt: Map<string, Date>; // dose key -> when it was given
};

/** What the Today screen and the reminder sender both need. Throws on failure. */
export async function loadTodayData(now: Date): Promise<TodayData> {
  const tz = getTimeZone();
  const supabase = getSupabase();

  const { data: drops, error } = await supabase
    .from("drops")
    .select(DROP_COLUMNS)
    .eq("active", true)
    .order("created_at")
    .returns<Drop[]>();
  if (error) throw error;

  const today = localDate(now, tz);
  const { data: log, error: logError } = await supabase
    .from("dose_log")
    .select("drop_id, scheduled_at, given_at")
    .gte("scheduled_at", zonedToUtc(today, 0, tz).toISOString())
    .lt("scheduled_at", zonedToUtc(addDays(today, 1), 0, tz).toISOString());
  if (logError) throw logError;

  const givenAt = new Map<string, Date>();
  for (const row of log) {
    givenAt.set(
      doseKey(row.drop_id, new Date(row.scheduled_at)),
      new Date(row.given_at),
    );
  }

  return { tz, drops, givenAt };
}
