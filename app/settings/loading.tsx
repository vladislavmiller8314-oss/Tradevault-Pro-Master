import { ShellSkeleton } from "@/components/ShellSkeleton";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <ShellSkeleton>
      <div className="p-6 max-w-2xl space-y-6">
        <Skeleton className="h-3 w-28" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-panel bg-panel-raised border border-panel-line p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </ShellSkeleton>
  );
}
