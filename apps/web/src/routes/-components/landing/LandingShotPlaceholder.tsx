import { cn } from "@/lib/utils";

/**
 * Placeholder frame for product screenshots. Swap `label` / aspect when assets land.
 */
export function LandingShotPlaceholder({
  label,
  className,
  aspect = "video",
}: {
  label: string;
  className?: string;
  aspect?: "video" | "square" | "wide" | "portrait";
}) {
  return (
    <div
      className={cn(
        "landing-shot-placeholder rounded-xl",
        aspect === "square" && "aspect-square",
        aspect === "wide" && "aspect-21/9",
        aspect === "portrait" && "aspect-4/5",
        aspect === "video" && "aspect-16/10",
        className,
      )}
      data-test="landing-shot-placeholder"
      role="img"
      aria-label={`${label} screenshot placeholder`}
    >
      <span className="text-xs font-semibold tracking-wide uppercase opacity-70">Screenshot</span>
      <span className="max-w-56 px-4 text-center text-sm font-medium">{label}</span>
    </div>
  );
}
