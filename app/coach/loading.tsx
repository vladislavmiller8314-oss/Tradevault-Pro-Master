import { ShellSkeleton } from "@/components/ShellSkeleton";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <ShellSkeleton>
      <div className="p-6 max-w-2xl">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}
