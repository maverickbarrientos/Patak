import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DropManageList } from "@/components/drop-manage-list";

export default function DropsPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-muted-foreground">
            ← Home
          </Link>
          <h1 className="text-2xl font-semibold">Drops</h1>
        </div>
        <Link
          href="/drops/new"
          className={buttonVariants({ className: "h-11 px-4 text-base" })}
        >
          Add drop
        </Link>
      </header>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <DropManageList />
      </Suspense>
    </main>
  );
}
