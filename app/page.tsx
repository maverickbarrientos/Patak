import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Today } from "@/components/today";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Patak logo"
            width={40}
            height={40}
            priority
            className="rounded-xl"
          />
          <h1 className="text-2xl font-semibold">Patak</h1>
        </div>
        <Link
          href="/drops"
          className={buttonVariants({ variant: "outline", className: "h-11 px-4 text-base" })}
        >
          Drops
        </Link>
      </header>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <Today />
      </Suspense>
    </main>
  );
}
