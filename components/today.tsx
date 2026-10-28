import { Check, ChevronDown, Droplets } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { markGiven, undoGiven } from "@/app/dose-actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { eyeLabel } from "@/lib/drops";
import { cn } from "@/lib/utils";
import { buildToday, formatTime, type Dose, type DoseStatus } from "@/lib/today";
import { loadTodayData, type TodayData } from "@/lib/today-data";

const STATUS_LABEL: Record<DoseStatus, string> = {
  done: "Given",
  due: "Due now",
  overdue: "Overdue",
  upcoming: "Coming up",
};

const PILL: Record<DoseStatus, string> = {
  done: "bg-success-soft text-success-foreground",
  due: "bg-brand text-brand-foreground",
  overdue: "bg-danger-soft text-danger-foreground",
  upcoming: "bg-muted text-muted-foreground",
};

// The coloured strip across the top of the Next drop card.
const BAND: Record<Exclude<DoseStatus, "done">, string> = {
  due: "bg-brand text-brand-foreground",
  overdue: "bg-danger-soft text-danger-foreground",
  upcoming: "bg-secondary text-secondary-foreground",
};

function Pill({
  status,
  children,
}: {
  status: DoseStatus;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        PILL[status],
      )}
    >
      {children}
    </span>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-foreground"
    >
      {children}
    </p>
  );
}

// The two fields that identify a dose when a form is submitted.
function DoseFields({ dose }: { dose: Dose }) {
  return (
    <>
      <input type="hidden" name="drop_id" value={dose.drop_id} />
      <input
        type="hidden"
        name="scheduled_at"
        value={dose.scheduled_at.toISOString()}
      />
    </>
  );
}

function DoseRow({
  dose,
  name,
  tz,
  givenAt,
}: {
  dose: Dose;
  name: string;
  tz: string;
  givenAt?: Date;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            "text-base font-semibold tabular-nums",
            dose.status === "done" && "text-muted-foreground",
          )}
        >
          {formatTime(dose.scheduled_at, tz)}
        </span>
        <span className="truncate text-sm text-muted-foreground">{name}</span>
      </div>
      {dose.status === "done" ? (
        <form action={undoGiven} className="flex items-center gap-2">
          <DoseFields dose={dose} />
          <Pill status="done">
            <Check className="size-3.5" aria-hidden />
            {givenAt ? formatTime(givenAt, tz) : STATUS_LABEL.done}
          </Pill>
          <SubmitButton
            pendingText="…"
            variant="outline"
            className="h-11 px-4 text-base"
          >
            Undo
          </SubmitButton>
        </form>
      ) : (
        <Pill status={dose.status}>{STATUS_LABEL[dose.status]}</Pill>
      )}
    </li>
  );
}

export async function Today() {
  await connection(); // the time and the database are per request

  const now = new Date();
  let data: TodayData;
  try {
    data = await loadTodayData(now);
  } catch {
    return <Notice>Could not load today. Check the server settings.</Notice>;
  }
  const { tz, drops, givenAt } = data;

  if (drops.length === 0) {
    return (
      <Card className="items-center text-center">
        <CardContent className="flex flex-col items-center gap-4 py-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Droplets className="size-7" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">No drops yet</p>
            <p className="text-sm text-muted-foreground">
              Add the first eye drop and Patak will tell you when each dose is
              due.
            </p>
          </div>
          <Link
            href="/drops/new"
            className={buttonVariants({ className: "h-12 px-6 text-base" })}
          >
            Add a drop
          </Link>
        </CardContent>
      </Card>
    );
  }

  const byId = new Map(drops.map((d) => [d.id, d]));
  const view = buildToday(drops, now, tz, new Set(givenAt.keys()));
  const name = (dose: Dose) => byId.get(dose.drop_id)?.name ?? "Drop";
  const next = view.next;
  const nextDrop = next && byId.get(next.drop_id);
  const allDone = view.nextIsTomorrow && view.doses.length > 0;
  const todo = view.doses.filter((d) => d.status !== "done");
  const finished = view.doses.filter((d) => d.status === "done");
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);

  return (
    <>
      <AutoRefresh />

      {allDone && (
        <div className="flex items-center gap-3 rounded-xl bg-success-soft px-4 py-3 text-success-foreground">
          <Check className="size-5 shrink-0" aria-hidden />
          <p className="text-sm font-medium">
            All done for today. Nice work.
          </p>
        </div>
      )}

      {next && nextDrop && (
        <Card className="gap-0 py-0 shadow-sm ring-1 ring-primary/15">
          <div
            className={cn(
              "flex items-center justify-between px-5 py-3 text-xs font-semibold uppercase tracking-wider",
              BAND[next.status === "done" ? "upcoming" : next.status],
            )}
          >
            <span>Next drop</span>
            <span>
              {view.nextIsTomorrow ? "Tomorrow" : STATUS_LABEL[next.status]}
            </span>
          </div>
          <CardContent className="flex flex-col gap-5 px-5 py-5">
            <div className="flex flex-col gap-1">
              <p className="text-4xl font-semibold leading-tight tracking-tight">
                {nextDrop.name}
              </p>
              <p className="text-base text-muted-foreground">
                {eyeLabel(nextDrop.eye)}
                <span aria-hidden> · </span>
                {next.status === "overdue" ? "was due at " : "due at "}
                <span className="font-semibold text-foreground">
                  {formatTime(next.scheduled_at, tz)}
                </span>
                {view.nextIsTomorrow && " tomorrow"}
              </p>
            </div>
            {!view.nextIsTomorrow && (
              <form action={markGiven}>
                <DoseFields dose={next} />
                <SubmitButton
                  pendingText="Saving…"
                  className="h-14 w-full text-lg font-semibold shadow-sm"
                >
                  <Check className="size-5" aria-hidden />
                  Given
                </SubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Today</h2>
          <span className="text-sm text-muted-foreground">{dateLabel}</span>
        </div>
        {view.doses.length === 0 ? (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            No doses are scheduled for today.
          </p>
        ) : (
          <>
            {todo.length > 0 && (
              <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {todo.map((dose) => (
                  <DoseRow key={dose.key} dose={dose} name={name(dose)} tz={tz} />
                ))}
              </ul>
            )}
            {finished.length > 0 && (
              // Given doses fold away so a long day stays easy to scan.
              <details className="group overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-success-foreground [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <Check className="size-4" aria-hidden />
                    {finished.length} given today
                  </span>
                  <ChevronDown
                    className="size-4 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <ul className="flex flex-col divide-y divide-border border-t border-border">
                  {finished.map((dose) => (
                    <DoseRow
                      key={dose.key}
                      dose={dose}
                      name={name(dose)}
                      tz={tz}
                      givenAt={givenAt.get(dose.key)}
                    />
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </section>
    </>
  );
}
