import { Skeleton } from "../stubs/skeleton";

export function PortfolioGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      data-test="portfolio-grid-skeleton"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-none border border-base-content/10 bg-base-300/40 p-0"
        >
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
