import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only: this uses the secret key, which bypasses Row Level Security.
// Never import this file from a client component.
export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
