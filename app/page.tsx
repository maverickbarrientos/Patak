import { Droplets } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { BrandHeader, PageShell } from "@/components/page-shell";
import { Reminders } from "@/components/reminders";
import { TodaySkeleton } from "@/components/skeletons";
import { Today } from "@/components/today";

// The test reminder waits 10 seconds after its action returns, which needs
// more than the default 10 second function limit.
export const maxDuration = 30;

export default function Home() {
  return (
    <PageShell>
      <BrandHeader>
        <Link
          href="/drops"
          className={buttonVariants({
            variant: "outline",
            className: "h-11 px-4 text-base",
          })}
        >
          <Droplets className="size-4" aria-hidden />
          Drops
        </Link>
      </BrandHeader>
      <Reminders />
      <Suspense fallback={<TodaySkeleton />}>
        <Today />
      </Suspense>
    </PageShell>
  );
}
