import { describe, expect, it } from "vitest";
import { parseReminderDevice } from "./reminder-device";

const good = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
  keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQ", auth: "tBHItJI5svbpez7KI4CCXg" },
};
const withEndpoint = (endpoint: string) => ({ ...good, endpoint });

describe("parseReminderDevice", () => {
  it("accepts a real Chrome subscription", () => {
    expect(parseReminderDevice(good)).toEqual({
      endpoint: good.endpoint,
      p256dh: good.keys.p256dh,
      auth: good.keys.auth,
    });
  });

  it("accepts the other real push services", () => {
    for (const endpoint of [
      "https://updates.push.services.mozilla.com/wpush/v2/xyz",
      "https://web.push.apple.com/abc",
      "https://wns2-par02p.notify.windows.com/w/?token=abc",
    ]) {
      expect(parseReminderDevice(withEndpoint(endpoint))).not.toBeNull();
    }
  });

  it("rejects an endpoint that is not a push service, so the server never posts to it", () => {
    for (const endpoint of [
      "https://evil.example.com/steal",
      "https://fcm.googleapis.com.evil.example.com/x",
      "https://example.com/?u=fcm.googleapis.com",
      "http://localhost:3000/x",
      "https://169.254.169.254/latest/meta-data",
    ]) {
      expect(parseReminderDevice(withEndpoint(endpoint))).toBeNull();
    }
  });

  it("rejects http even on a real push host", () => {
    expect(parseReminderDevice(withEndpoint("http://fcm.googleapis.com/x"))).toBeNull();
  });

  it("rejects missing, wrong-typed or malformed fields", () => {
    expect(parseReminderDevice(null)).toBeNull();
    expect(parseReminderDevice("nope")).toBeNull();
    expect(parseReminderDevice({})).toBeNull();
    expect(parseReminderDevice({ endpoint: good.endpoint })).toBeNull();
    expect(parseReminderDevice({ ...good, endpoint: 42 })).toBeNull();
    expect(parseReminderDevice({ ...good, endpoint: "not a url" })).toBeNull();
    expect(parseReminderDevice({ ...good, keys: { p256dh: "bad key!", auth: "x" } })).toBeNull();
    expect(parseReminderDevice({ ...good, keys: { ...good.keys, auth: "" } })).toBeNull();
  });

  it("rejects absurdly long values", () => {
    expect(parseReminderDevice(withEndpoint("https://fcm.googleapis.com/" + "a".repeat(2000)))).toBeNull();
    expect(parseReminderDevice({ ...good, keys: { ...good.keys, p256dh: "A".repeat(200) } })).toBeNull();
  });
});
