"use server";

import { after } from "next/server";
import { sendPush } from "@/lib/push";
import { parseReminderDevice } from "@/lib/reminder-device";
import { getSupabase } from "@/lib/supabase-server";

const TEST_DELAY_MS = 10_000;

export type ReminderResult = { ok: boolean; message?: string };

export async function saveReminderDevice(
  subscription: unknown,
): Promise<ReminderResult> {
  const device = parseReminderDevice(subscription);
  if (!device) return { ok: false, message: "That phone could not be saved." };

  // One row per phone: saving the same phone again just refreshes it.
  const { error } = await getSupabase()
    .from("reminder_device")
    .upsert(device, { onConflict: "endpoint" });
  if (error) return { ok: false, message: "That phone could not be saved." };
  return { ok: true };
}

export async function sendTestReminder(
  endpoint: string,
): Promise<ReminderResult> {
  const supabase = getSupabase();
  const { data: device, error } = await supabase
    .from("reminder_device")
    .select("endpoint, p256dh, auth")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (error) return { ok: false, message: "Could not send the test." };
  if (!device) {
    return { ok: false, message: "This phone is not saved. Turn reminders on again." };
  }

  // Wait a little so the app can be closed first, which is the real test.
  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, TEST_DELAY_MS));
    const result = await sendPush(device, {
      title: "Patak test",
      body: "Reminders are working.",
      url: "/",
    });
    if (result === "gone") {
      await supabase.from("reminder_device").delete().eq("endpoint", endpoint);
    }
  });

  return { ok: true };
}
