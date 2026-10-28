import { DropForm } from "@/components/drop-form";
import { PageHeader, PageShell } from "@/components/page-shell";

export default function NewDropPage() {
  return (
    <PageShell>
      <PageHeader title="Add a drop" backHref="/drops" backLabel="Drops" />
      <DropForm />
    </PageShell>
  );
}
