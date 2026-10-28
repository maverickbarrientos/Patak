import { Suspense } from "react";
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
        </CardContent>
      </Card>
    </main>
  );
}
