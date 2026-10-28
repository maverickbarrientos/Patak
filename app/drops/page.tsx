import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DropManageList } from "@/components/drop-manage-list";
import { PageHeader, PageShell } from "@/components/page-shell";
import { DropsSkeleton } from "@/components/skeletons";

export default function DropsPage() {
  return (
    <PageShell>
      <PageHeader title="Drops">
        <Link
          href="/drops/new"
          className={buttonVariants({ className: "h-11 px-4 text-base" })}
        >
          <Plus className="size-4" aria-hidden />
          Add drop
        </Link>
      </PageHeader>
      <Suspense fallback={<DropsSkeleton />}>
        <DropManageList />
      </Suspense>
    </PageShell>
  );
}
