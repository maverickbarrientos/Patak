import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DropForm } from "@/components/drop-form";
import { DROP_COLUMNS, isUuid, type Drop } from "@/lib/drops";
import { getSupabase } from "@/lib/supabase-server";

async function EditDrop({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { data } = await getSupabase()
    .from("drops")
    .select(DROP_COLUMNS)
    .eq("id", id)
    .maybeSingle<Drop>();
  if (!data) notFound();

  return <DropForm drop={data} />;
}

export default function EditDropPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Edit drop</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <EditDrop params={params} />
      </Suspense>
    </main>
  );
}
