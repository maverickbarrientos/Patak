import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// The one column every screen sits in, so spacing is the same everywhere.
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 pb-12 pt-5">
      {children}
    </main>
  );
}

/** Logo and name, for the home screen. */
export function BrandHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt=""
          width={44}
          height={44}
          priority
          className="rounded-xl shadow-sm"
        />
        <span className="text-2xl font-semibold tracking-tight">Patak</span>
      </Link>
      {children}
    </header>
  );
}

/** Back link, title and an optional action, for every other screen. */
export function PageHeader({
  title,
  backHref = "/",
  backLabel = "Home",
  children,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3">
      <div className="flex flex-col">
        <Link
          href={backHref}
          className="-ml-1 inline-flex min-h-8 items-center gap-0.5 text-sm font-medium text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children}
    </header>
  );
}
