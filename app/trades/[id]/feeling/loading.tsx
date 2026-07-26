import { ShellSkeleton } from "@/components/ShellSkeleton";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <ShellSkeleton>
      <div className="p-6 max-w-lg mx-auto">
        <div className="text-center mb-5 space-y-2">
          <Skeleton className="h-3 w-32 mx-auto" />
          <Skeleton className="h-5 w-40 mx-auto" />
        </div>
        <div className="rounded-panel bg-panel-raised border border-panel-line p-5 space-y-5">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </ShellSkeleton>
  );
}
