import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DropForm } from "@/components/drop-form";
import { PageHeader, PageShell } from "@/components/page-shell";
import { FormSkeleton } from "@/components/skeletons";
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
    <PageShell>
      <PageHeader title="Edit drop" backHref="/drops" backLabel="Drops" />
      <Suspense fallback={<FormSkeleton />}>
        <EditDrop params={params} />
      </Suspense>
    </PageShell>
  );
}
