import { connection } from "next/server";
import { DROP_COLUMNS, describeDrop, type Drop } from "@/lib/drops";
import { getSupabase } from "@/lib/supabase-server";

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
    .select(DROP_COLUMNS)
    .order("created_at")
    .returns<Drop[]>();

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
            {describeDrop(drop)}
          </span>
        </li>
      ))}
    </ul>
  );
}
