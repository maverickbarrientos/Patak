import { Pause, Pencil, Play } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { setDropActive } from "@/app/drops/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DROP_COLUMNS,
  describeSchedule,
  eyeLabel,
  type Drop,
} from "@/lib/drops";
import { getSupabase } from "@/lib/supabase-server";
import { cn } from "@/lib/utils";

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
      <p
        role="alert"
        className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-foreground"
      >
        Could not load the drops. Check the database settings.
      </p>
    );
  }

  if (drops.length === 0) {
    return (
      <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        No drops yet. Add the first one.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {drops.map((drop) => (
        <li
          key={drop.id}
          className={cn(
            "flex flex-col gap-4 rounded-2xl p-4 ring-1 ring-foreground/10",
            drop.active ? "bg-card shadow-xs" : "bg-muted/60",
          )}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-lg font-semibold",
                  !drop.active && "text-muted-foreground",
                )}
              >
                {drop.name}
              </span>
              {!drop.active && (
                <span className="rounded-full bg-sun-soft px-2.5 py-0.5 text-xs font-semibold text-sun-foreground">
                  Paused
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {eyeLabel(drop.eye)}
              <span aria-hidden> · </span>
              {describeSchedule(drop)}
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
              <Pencil className="size-4" aria-hidden />
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
                {drop.active ? (
                  <Pause className="size-4" aria-hidden />
                ) : (
                  <Play className="size-4" aria-hidden />
                )}
                {drop.active ? "Pause" : "Resume"}
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
