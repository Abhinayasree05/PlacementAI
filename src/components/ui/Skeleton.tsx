import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton rounded-lg", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
      <Skeleton className="mb-2 h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
