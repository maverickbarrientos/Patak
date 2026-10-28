import { createHash, timingSafeEqual } from "node:crypto";

const MIN_SECRET_LENGTH = 16;

/**
 * Does the request carry `Authorization: Bearer <secret>`? An unset or weak
 * secret never authorises anything, so a missing setting cannot open the door.
 */
export function isAuthorized(
  header: string | null,
  secret: string | undefined,
): boolean {
  if (!header || !secret || secret.length < MIN_SECRET_LENGTH) return false;
  // Hash both sides so the comparison is constant-time and equal-length.
  const sha = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(sha(header), sha(`Bearer ${secret}`));
}
