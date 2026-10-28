import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

const hhmm = (t: string) => t.slice(0, 5);

export async function DropList() {
  await connection(); // read the database per request, never at build time
  let supabase;
  try {
    supabase = getSupabase();
  } catch {
    return (
      <p className="text-sm text-destructive">
        The database settings are missing on the server.
      </p>
    );
  }

  const { data, error } = await supabase
    .from("drops")
    .select("id, name, eye, interval_hours, day_start, day_end, active")
    .order("created_at");

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Could not load the drops. Check the database settings.
      </p>
    );
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No drops yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((drop) => (
        <li key={drop.id} className="flex flex-col">
          <span className="font-medium">
            {drop.name}
            {!drop.active && (
              <span className="text-muted-foreground"> (paused)</span>
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {drop.eye} eye, every {Number(drop.interval_hours)} h,{" "}
            {hhmm(drop.day_start)} to {hhmm(drop.day_end)}
          </span>
        </li>
      ))}
    </ul>
  );
}
