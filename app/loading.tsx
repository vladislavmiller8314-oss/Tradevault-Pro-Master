import { ShellSkeleton } from "@/components/ShellSkeleton";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <ShellSkeleton>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-panel bg-panel-raised border border-panel-line p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-panel bg-panel-raised border border-panel-line p-4">
            <Skeleton className="h-3 w-28 mb-4" />
            <Skeleton className="h-56 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-panel bg-panel-raised border border-panel-line p-4">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="rounded-panel bg-panel-raised border border-panel-line p-4">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-panel bg-panel-raised border border-panel-line p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}
