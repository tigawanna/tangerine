import { cn } from "@/lib/utils";

/** Amber ripple tokens for landing / auth / status surfaces. */
export const landingRippleToneClassName = cn(
  "[--cell-border-color:color-mix(in_oklch,var(--color-landing-amber)_28%,transparent)]",
  "[--cell-fill-color:color-mix(in_oklch,var(--color-landing-amber)_8%,transparent)]",
  "[--cell-shadow-color:color-mix(in_oklch,var(--color-landing-amber)_40%,transparent)]",
  "dark:[--cell-border-color:color-mix(in_oklch,var(--color-landing-amber)_35%,transparent)]",
  "dark:[--cell-fill-color:color-mix(in_oklch,var(--color-landing-amber)_10%,transparent)]",
  "dark:[--cell-shadow-color:color-mix(in_oklch,var(--color-landing-amber)_45%,transparent)]",
);
