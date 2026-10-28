export type ReminderDevice = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

// There is no login, so anyone with the link could register a "phone". The
// server later POSTs to whatever endpoint is saved, so only accept the real
// push services that browsers use.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/, // Chrome and Edge on Android
  /^updates\.push\.services\.mozilla\.com$/, // Firefox
  /^web\.push\.apple\.com$/, // Safari
  /\.notify\.windows\.com$/, // Edge on Windows
];

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

export function parseReminderDevice(input: unknown): ReminderDevice | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };

  const { endpoint } = raw;
  const p256dh = raw.keys?.p256dh;
  const auth = raw.keys?.auth;
  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof auth !== "string"
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || endpoint.length > 1024) return null;
  if (!PUSH_HOSTS.some((host) => host.test(url.hostname))) return null;

  if (!BASE64URL.test(p256dh) || p256dh.length > 128) return null;
  if (!BASE64URL.test(auth) || auth.length > 64) return null;

  return { endpoint, p256dh, auth };
}
