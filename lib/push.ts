import "server-only";
import webpush from "web-push";
import type { ReminderDevice } from "@/lib/reminder-device";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  // A new notification with the same tag replaces the old one.
  tag?: string;
};

// Server-only: the private key signs every notification we send.
function configured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT must be set",
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

/**
 * Sends one notification. Returns "gone" when the phone has unsubscribed or
 * the address is dead, so the caller can forget it. Other failures throw.
 */
export async function sendPush(
  device: ReminderDevice,
  payload: PushPayload,
): Promise<"sent" | "gone"> {
  try {
    await configured().sendNotification(
      {
        endpoint: device.endpoint,
        keys: { p256dh: device.p256dh, auth: device.auth },
      },
      JSON.stringify(payload),
      // High urgency asks Android to deliver at once, even in battery saver.
      { TTL: 60 * 60, urgency: "high" },
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    throw error;
  }
}
