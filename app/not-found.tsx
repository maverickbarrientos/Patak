import { Droplets } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/page-shell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <Droplets className="size-8" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Nothing here
          </h1>
          <p className="text-sm text-muted-foreground">
            That page doesn&apos;t exist, or the drop was removed.
          </p>
        </div>
        <Link
          href="/"
          className={buttonVariants({ className: "h-12 px-6 text-base" })}
        >
          Back to Today
        </Link>
      </div>
    </PageShell>
  );
}
