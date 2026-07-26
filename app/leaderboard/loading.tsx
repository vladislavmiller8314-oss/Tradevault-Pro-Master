import { ShellSkeleton } from "@/components/ShellSkeleton";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <ShellSkeleton>
      <div className="p-6 max-w-2xl">
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="rounded-panel bg-panel-raised border border-panel-line p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}
