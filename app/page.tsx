import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DropList } from "@/components/drop-list";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Image
            src="/logo.png"
            alt="Patak logo"
            width={64}
            height={64}
            priority
            className="mb-2 rounded-2xl"
          />
          <CardTitle className="text-2xl">Patak</CardTitle>
          <CardDescription>
            Eye drop tracker for the right eye.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
          >
            <DropList />
          </Suspense>
          <Link
            href="/drops"
            className={buttonVariants({
              variant: "outline",
              className: "mt-5 h-11 w-full text-base",
            })}
          >
            Manage drops
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
