"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { saveReminderDevice, sendTestReminder } from "@/app/reminder-actions";
import { Button } from "@/components/ui/button";

type Status = "checking" | "unsupported" | "blocked" | "off" | "on";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// The browser wants the public key as bytes, not as base64url text.
function keyToBytes(base64Url: string) {
  const padded = base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function Reminders() {
  const [status, setStatus] = useState<Status>("checking");
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (
        !VAPID_PUBLIC_KEY ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setStatus("unsupported");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      if (Notification.permission === "denied") {
        setStatus("blocked");
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      if (!existing) {
        setStatus("off");
        return;
      }
      // Keep the saved copy in step with the phone, in case it was lost.
      // Only say "on" if the server really has this phone.
      const saved = await saveReminderDevice(existing.toJSON());
      if (!saved.ok) {
        setMessage(saved.message ?? "Could not turn on reminders.");
        setStatus("off");
        return;
      }
      setEndpoint(existing.endpoint);
      setStatus("on");
    })().catch(() => setStatus("off"));
  }, []);

  async function turnOn() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY!),
        }));

      const result = await saveReminderDevice(subscription.toJSON());
      if (!result.ok) {
        setMessage(result.message ?? "Could not turn on reminders.");
        return;
      }
      setEndpoint(subscription.endpoint);
      setStatus("on");
    } catch {
      setMessage("Could not turn on reminders. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (!endpoint) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await sendTestReminder(endpoint);
      setMessage(
        result.ok
          ? "Test sent. Close the app now. It arrives in about 10 seconds."
          : (result.message ?? "Could not send the test."),
      );
    } catch {
      setMessage("Could not send the test.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        This browser can&apos;t show reminders. Open Patak in Chrome on Android.
      </p>
    );
  }

  if (status === "blocked") {
    return (
      <div className="flex gap-3 rounded-2xl bg-danger-soft p-4 text-danger-foreground">
        <BellOff className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold">Reminders are blocked</p>
          <p className="text-sm">
            To turn them on: open Chrome, tap the three dots, then Settings,
            Site settings, Notifications, find this site and choose Allow.
            Then reload this page.
          </p>
        </div>
      </div>
    );
  }

  if (status === "off") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl bg-sun-soft p-4 text-sun-foreground ring-1 ring-sun/60">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sun text-sun-foreground">
            <Bell className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold">Turn on reminders</p>
            <p className="text-sm">
              Get a notification when a drop is due, even when the app is
              closed.
            </p>
          </div>
        </div>
        <Button
          onClick={turnOn}
          disabled={busy}
          className="h-12 text-base font-semibold"
        >
          {busy ? "Turning on…" : "Turn on reminders"}
        </Button>
        {message && (
          <p role="alert" className="text-sm font-medium text-danger-foreground">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-success-soft px-4 py-2 text-success-foreground">
        <p className="flex items-center gap-2 text-sm font-medium">
          <BellRing className="size-4" aria-hidden />
          Reminders are on
        </p>
        <Button
          variant="outline"
          onClick={sendTest}
          disabled={busy}
          className="h-11 px-4 text-base"
        >
          {busy ? "Sending…" : "Send a test"}
        </Button>
      </div>
      {message && <p className="px-1 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
