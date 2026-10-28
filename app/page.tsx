import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
          <Button size="lg" className="w-full">
            It is live
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
