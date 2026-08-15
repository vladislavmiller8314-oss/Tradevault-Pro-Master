import { ShellSkeleton } from "@/components/ShellSkeleton";
import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <ShellSkeleton>
      <div className="p-6 max-w-3xl space-y-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    </ShellSkeleton>
  );
}
