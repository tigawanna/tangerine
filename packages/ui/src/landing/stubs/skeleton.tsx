import { twMerge } from "tailwind-merge";

/**
 * Lightweight skeleton placeholder for deferred landing grids.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={twMerge("animate-pulse rounded-none bg-landing-cream/10", className)} />;
}
