import { ShellSkeleton } from "@/components/ShellSkeleton";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <ShellSkeleton>
      <div className="p-6 max-w-3xl">
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}
