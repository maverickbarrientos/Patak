import Link from "next/link";
import { connection } from "next/server";
import { AutoRefresh } from "@/components/auto-refresh";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTimeZone } from "@/lib/config";
import { DROP_COLUMNS, type Drop } from "@/lib/drops";
import { getSupabase } from "@/lib/supabase-server";
import { buildToday, formatTime, type Dose, type DoseStatus } from "@/lib/today";

const STATUS_LABEL: Record<DoseStatus, string> = {
  done: "Done",
  due: "Due now",
  overdue: "Overdue",
  upcoming: "Coming up",
};

const STATUS_STYLE: Record<DoseStatus, string> = {
  done: "text-muted-foreground line-through",
  due: "font-semibold text-primary",
  overdue: "font-semibold text-destructive",
  upcoming: "text-muted-foreground",
};

function Message({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-destructive">{children}</p>;
}

export async function Today() {
  await connection(); // the time and the database are per request

  let tz: string;
  let drops: Drop[];
  try {
    tz = getTimeZone();
    const { data, error } = await getSupabase()
      .from("drops")
      .select(DROP_COLUMNS)
      .eq("active", true)
      .order("created_at")
      .returns<Drop[]>();
    if (error) throw error;
    drops = data;
  } catch {
    return <Message>Could not load today. Check the server settings.</Message>;
  }

  if (drops.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4">
          <p className="text-base">No drops yet. Add the first one to start.</p>
          <Link
            href="/drops/new"
            className={buttonVariants({ className: "h-11 text-base" })}
          >
            Add a drop
          </Link>
        </CardContent>
      </Card>
    );
  }

  const byId = new Map(drops.map((d) => [d.id, d]));
  const view = buildToday(drops, new Date(), tz);
  const name = (dose: Dose) => byId.get(dose.drop_id)?.name ?? "Drop";
  const next = view.next;
  const nextDrop = next && byId.get(next.drop_id);

  return (
    <>
      <AutoRefresh />
      {next && nextDrop && (
        <Card
          className={
            next.status === "overdue"
              ? "ring-2 ring-destructive"
              : next.status === "due"
                ? "ring-2 ring-primary"
                : undefined
          }
        >
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Next drop
            </p>
            <p className="text-3xl font-semibold leading-tight">
              {nextDrop.name}
            </p>
            <p className="text-lg">{nextDrop.eye} eye</p>
            <p className={`text-lg ${STATUS_STYLE[next.status]}`}>
              {next.status === "due" && `Due now, at ${formatTime(next.scheduled_at, tz)}`}
              {next.status === "overdue" &&
                `Overdue, was due at ${formatTime(next.scheduled_at, tz)}`}
              {next.status === "upcoming" &&
                `Due ${view.nextIsTomorrow ? "tomorrow " : ""}at ${formatTime(next.scheduled_at, tz)}`}
            </p>
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Today</h2>
        {view.doses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No doses are scheduled for today.
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-xl border">
            {view.doses.map((dose) => (
              <li
                key={dose.key}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex flex-col">
                  <span className="text-base font-medium">
                    {formatTime(dose.scheduled_at, tz)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {name(dose)}
                  </span>
                </div>
                <span className={`text-sm ${STATUS_STYLE[dose.status]}`}>
                  {STATUS_LABEL[dose.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
