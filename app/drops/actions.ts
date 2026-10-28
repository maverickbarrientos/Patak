"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDropForm, type DropFormErrors } from "@/lib/drop-form";
import { isUuid } from "@/lib/drops";
import { getSupabase } from "@/lib/supabase-server";

export type SaveDropState = {
  errors?: DropFormErrors;
  message?: string;
  // What the user typed, so a failed save does not wipe the form.
  values?: Record<string, string>;
};

const FIELDS = ["name", "interval_hours", "day_start", "day_end"];

export async function saveDrop(
  _prev: SaveDropState,
  formData: FormData,
): Promise<SaveDropState> {
  const values = Object.fromEntries(
    FIELDS.map((k) => [k, String(formData.get(k) ?? "")]),
  );

  const parsed = parseDropForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, values };

  const id = String(formData.get("id") ?? "");
  const supabase = getSupabase();

  if (id) {
    if (!isUuid(id)) return { message: "That drop was not found.", values };
    const { data, error } = await supabase
      .from("drops")
      .update(parsed.values)
      .eq("id", id)
      .select("id");
    if (error) return { message: "Could not save the drop. Try again.", values };
    if (data.length === 0) return { message: "That drop was not found.", values };
  } else {
    const { error } = await supabase.from("drops").insert(parsed.values);
    if (error) return { message: "Could not save the drop. Try again.", values };
  }

  revalidatePath("/drops");
  redirect("/drops");
}

export async function setDropActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!isUuid(id)) throw new Error("Invalid drop id");

  const { error } = await getSupabase()
    .from("drops")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error("Could not update the drop");

  revalidatePath("/drops");
}
