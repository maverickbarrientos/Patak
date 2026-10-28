"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveDrop, type SaveDropState } from "@/app/drops/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toHHMM } from "@/lib/drop-form";
import type { Drop } from "@/lib/drops";

const initialState: SaveDropState = {};

export function DropForm({ drop }: { drop?: Drop }) {
  const [state, formAction, pending] = useActionState(saveDrop, initialState);

  const initial = {
    name: drop?.name ?? "",
    interval_hours: drop ? String(Number(drop.interval_hours)) : "",
    day_start: drop ? toHHMM(drop.day_start) : "08:00",
    day_end: drop ? toHHMM(drop.day_end) : "20:00",
  };
  const value = (k: keyof typeof initial) => state.values?.[k] ?? initial[k];
  const err = state.errors;

  return (
    <form
      action={formAction}
      noValidate
      className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-xs ring-1 ring-foreground/10"
    >
      {drop && <input type="hidden" name="id" value={drop.id} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name of the drop</Label>
        <Input
          id="name"
          name="name"
          defaultValue={value("name")}
          placeholder="e.g. Antibiotic"
          autoComplete="off"
          aria-invalid={!!err?.name}
          aria-describedby={err?.name ? "name-error" : undefined}
          className="h-11 text-base"
        />
        {err?.name && (
          <p id="name-error" className="text-sm text-destructive">
            {err.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="interval_hours">Hours between doses</Label>
        <Input
          id="interval_hours"
          name="interval_hours"
          type="number"
          inputMode="decimal"
          step="any"
          defaultValue={value("interval_hours")}
          placeholder="e.g. 4"
          aria-invalid={!!err?.interval_hours}
          aria-describedby={
            err?.interval_hours ? "interval_hours-error" : undefined
          }
          className="h-11 text-base"
        />
        {err?.interval_hours && (
          <p id="interval_hours-error" className="text-sm text-destructive">
            {err.interval_hours}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="day_start">First dose</Label>
          <Input
            id="day_start"
            name="day_start"
            type="time"
            defaultValue={value("day_start")}
            aria-invalid={!!err?.day_start}
            aria-describedby={err?.day_start ? "day_start-error" : undefined}
            className="h-11 text-base"
          />
          {err?.day_start && (
            <p id="day_start-error" className="text-sm text-destructive">
              {err.day_start}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="day_end">Last dose</Label>
          <Input
            id="day_end"
            name="day_end"
            type="time"
            defaultValue={value("day_end")}
            aria-invalid={!!err?.day_end}
            aria-describedby={err?.day_end ? "day_end-error" : undefined}
            className="h-11 text-base"
          />
          {err?.day_end && (
            <p id="day_end-error" className="text-sm text-destructive">
              {err.day_end}
            </p>
          )}
        </div>
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-12 flex-1 text-base font-semibold"
        >
          {pending ? "Saving…" : drop ? "Save changes" : "Add drop"}
        </Button>
        <Link
          href="/drops"
          className={buttonVariants({ variant: "outline", className: "h-12 text-base" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
