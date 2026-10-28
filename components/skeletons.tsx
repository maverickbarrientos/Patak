import { Skeleton } from "@/components/ui/skeleton";

// Placeholders shown while the database answers, shaped like what replaces them.

export function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-6 w-28" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function DropsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}
