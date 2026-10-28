import Link from "next/link";
import { connection } from "next/server";
import { setDropActive } from "@/app/drops/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { DROP_COLUMNS, describeDrop, type Drop } from "@/lib/drops";
import { getSupabase } from "@/lib/supabase-server";

export async function DropManageList() {
  await connection(); // read the database per request, never at build time

  let drops: Drop[];
  try {
    const { data, error } = await getSupabase()
      .from("drops")
      .select(DROP_COLUMNS)
      .order("created_at");
    if (error) throw error;
    drops = data;
  } catch {
    return (
      <p className="text-sm text-destructive">
        Could not load the drops. Check the database settings.
      </p>
    );
  }

  if (drops.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No drops yet. Add the first one.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {drops.map((drop) => (
        <li
          key={drop.id}
          className="flex flex-col gap-3 rounded-xl border p-4"
        >
          <div className="flex flex-col">
            <span className="text-base font-medium">
              {drop.name}
              {!drop.active && (
                <span className="text-muted-foreground"> (paused)</span>
              )}
            </span>
            <span className="text-sm text-muted-foreground">
              {describeDrop(drop)}
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/drops/${drop.id}`}
              className={buttonVariants({
                variant: "outline",
                className: "h-11 flex-1 text-base",
              })}
            >
              Edit
            </Link>
            <form action={setDropActive} className="flex-1">
              <input type="hidden" name="id" value={drop.id} />
              <input
                type="hidden"
                name="active"
                value={drop.active ? "false" : "true"}
              />
              <Button
                type="submit"
                variant={drop.active ? "secondary" : "default"}
                className="h-11 w-full text-base"
              >
                {drop.active ? "Pause" : "Resume"}
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
