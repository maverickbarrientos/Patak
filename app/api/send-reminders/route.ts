import { isAuthorized } from "@/lib/cron-auth";
import { sendPush } from "@/lib/push";
import {
  REMINDER_REPEAT_MINUTES,
  dosesToRemind,
  reminderMessage,
} from "@/lib/reminders";
import type { Dose } from "@/lib/today";
import { loadTodayData } from "@/lib/today-data";
import { getSupabase } from "@/lib/supabase-server";

type Supabase = ReturnType<typeof getSupabase>;

/**
 * Atomically decides whether this run owns the reminder for `dose`: true for
 * the first reminder, or when the last one is at least 10 minutes old. If two
 * runs overlap, only one of them wins, so a dose is never reminded twice.
 */
async function claim(supabase: Supabase, dose: Dose, now: Date) {
  const scheduled_at = dose.scheduled_at.toISOString();
  const sentNow = now.toISOString();

  const first = await supabase
    .from("reminder_log")
    .upsert(
      { drop_id: dose.drop_id, scheduled_at, last_sent_at: sentNow },
      { onConflict: "drop_id,scheduled_at", ignoreDuplicates: true },
    )
    .select("drop_id");
  if (first.error) throw first.error;
  if (first.data.length > 0) return true;

  const tooRecent = new Date(
    now.getTime() - REMINDER_REPEAT_MINUTES * 60_000,
  ).toISOString();
  const repeat = await supabase
    .from("reminder_log")
    .update({ last_sent_at: sentNow })
    .eq("drop_id", dose.drop_id)
    .eq("scheduled_at", scheduled_at)
    .lte("last_sent_at", tooRecent)
    .select("drop_id");
  if (repeat.error) throw repeat.error;
  return repeat.data.length > 0;
}

// Called every minute by pg_cron. Anything without the secret does nothing.
export async function POST(request: Request) {
  if (
    !isAuthorized(
      request.headers.get("authorization"),
      process.env.REMINDER_CRON_SECRET,
    )
  ) {
    return new Response(null, { status: 401 });
  }

  try {
    const now = new Date();
    const { tz, drops, givenAt } = await loadTodayData(now);
    const due = dosesToRemind(drops, now, tz, new Set(givenAt.keys()));
    if (due.length === 0) return Response.json({ due: 0, reminded: 0 });

    const supabase = getSupabase();
    const { data: devices, error } = await supabase
      .from("reminder_device")
      .select("endpoint, p256dh, auth");
    if (error) throw error;
    if (devices.length === 0) {
      return Response.json({ due: due.length, reminded: 0 });
    }

    // Each dose is claimed on its own, so each still gets exactly one reminder
    // per 10 minutes. But the phone gets ONE notification covering everything
    // that is due, never one per dose.
    let reminded = 0;
    for (const dose of due) {
      if (await claim(supabase, dose, now)) reminded += 1;
    }
    if (reminded === 0) return Response.json({ due: due.length, reminded: 0 });

    const byId = new Map(drops.map((d) => [d.id, d]));
    const message = reminderMessage(
      due.map((dose) => ({ drop: byId.get(dose.drop_id)!, dose })),
      tz,
    );
    const results = await Promise.allSettled(
      devices.map((device) => sendPush(device, message)),
    );

    // A phone that has unsubscribed answers "gone": forget it.
    const gone = devices.filter((_, i) => {
      const r = results[i];
      return r.status === "fulfilled" && r.value === "gone";
    });
    if (gone.length > 0) {
      await supabase
        .from("reminder_device")
        .delete()
        .in("endpoint", gone.map((d) => d.endpoint));
    }
    for (const r of results) {
      if (r.status === "rejected") {
        console.error("reminder push failed:", (r.reason as Error).message);
      }
    }
    return Response.json({ due: due.length, reminded });
  } catch (error) {
    console.error("send-reminders failed:", (error as Error).message);
    return Response.json({ error: "Could not send reminders" }, { status: 500 });
  }
}
