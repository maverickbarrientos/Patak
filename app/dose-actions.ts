"use server";

import { revalidatePath } from "next/cache";
import { getTimeZone } from "@/lib/config";
import { isUuid, type Drop } from "@/lib/drops";
import { getSupabase } from "@/lib/supabase-server";
import { isScheduledSlot } from "@/lib/today";

function readDose(formData: FormData) {
  const drop_id = String(formData.get("drop_id") ?? "");
  const scheduled_at = new Date(String(formData.get("scheduled_at") ?? ""));
  if (!isUuid(drop_id) || Number.isNaN(scheduled_at.getTime())) {
    throw new Error("Invalid dose");
  }
  return { drop_id, scheduled_at };
}

export async function markGiven(formData: FormData) {
  const { drop_id, scheduled_at } = readDose(formData);
  const supabase = getSupabase();

  const { data: drop, error: dropError } = await supabase
    .from("drops")
    .select("id, interval_hours, day_start, day_end")
    .eq("id", drop_id)
    .maybeSingle<Pick<Drop, "id" | "interval_hours" | "day_start" | "day_end">>();
  if (dropError) throw new Error("Could not read the drop");

  // Only real dose times from today count. A stale page (left open past
  // midnight, or a drop that changed) just refreshes instead of saving junk.
  if (drop && isScheduledSlot(drop, scheduled_at, new Date(), getTimeZone())) {
    // Unique on (drop_id, scheduled_at): a double tap cannot log it twice.
    const { error } = await supabase.from("dose_log").upsert(
      { drop_id, scheduled_at: scheduled_at.toISOString() },
      { onConflict: "drop_id,scheduled_at", ignoreDuplicates: true },
    );
    if (error) throw new Error("Could not save the dose");
  }

  revalidatePath("/");
}

export async function undoGiven(formData: FormData) {
  const { drop_id, scheduled_at } = readDose(formData);

  const { error } = await getSupabase()
    .from("dose_log")
    .delete()
    .eq("drop_id", drop_id)
    .eq("scheduled_at", scheduled_at.toISOString());
  if (error) throw new Error("Could not undo the dose");

  revalidatePath("/");
}
