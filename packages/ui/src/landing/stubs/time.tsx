import { twMerge } from "tailwind-merge";

type TimeCompponentProps = {
  time: string;
  relative?: boolean;
  className?: string;
};

/**
 * Formats an ISO timestamp for landing project cards.
 */
export function TimeCompponent({ time, relative = false, className }: TimeCompponentProps) {
  const date = new Date(time);
  const label = relative
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        "day",
      )
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <time dateTime={time} className={twMerge("text-xs", className)}>
      {label}
    </time>
  );
}
