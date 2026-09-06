import { BackgroundRippleEffect } from "@/components/acceternity/background-ripple-effect";
import { landingRippleToneClassName } from "@/lib/landing/rippleTone";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type RouteStatusShellProps = {
  /** Optional status pill (e.g. 404 / error). Omit for a cleaner pending state. */
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  /** Optional mark / loader between the hairline and headline */
  visual?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  className?: string;
  "data-test"?: string;
};

/**
 * Full-viewport shell for router 404 / error / pending surfaces.
 * Uses the landing theme + pulsing ripple grid (same language as auth).
 */
export function RouteStatusShell({
  eyebrow,
  title,
  description,
  visual,
  actions,
  footer,
  busy = false,
  className,
  "data-test": dataTest,
}: RouteStatusShellProps) {
  return (
    <div
      data-test={dataTest}
      role={busy ? "status" : undefined}
      aria-live={busy ? "polite" : undefined}
      aria-busy={busy || undefined}
      className={cn(
        "landing-page relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20",
        className,
      )}
    >
      <BackgroundRippleEffect
        rows={14}
        cols={16}
        cellSize={48}
        pulse
        pulseInterval={3600}
        pulseTarget="random"
        className={landingRippleToneClassName}
      />
      <div
        aria-hidden
        className="from-landing-surface via-landing-surface/70 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent"
      />
      <div
        aria-hidden
        className="from-landing-surface via-transparent to-landing-surface pointer-events-none absolute inset-0 bg-linear-to-b"
      />

      <div
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col items-center text-center",
          !eyebrow && !visual ? "pt-6" : null,
        )}
      >
        {eyebrow ? (
          <p className="text-landing-fg-muted inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.18em] uppercase">
            <span
              aria-hidden
              className="bg-landing-amber size-1.5 animate-pulse rounded-full"
            />
            <span className="text-landing-amber">{eyebrow}</span>
          </p>
        ) : null}

        {visual ? (
          <div className={eyebrow ? "mt-10" : undefined}>{visual}</div>
        ) : null}

        <h1
          className={cn(
            "landing-display text-landing-fg text-[clamp(2.25rem,7vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.04em]",
            visual ? "mt-8" : eyebrow ? "mt-6" : "mt-0",
          )}
        >
          {title}
        </h1>

        {description ? (
          <p className="text-landing-fg-muted mt-4 max-w-sm text-[1.05rem] leading-relaxed">
            {description}
          </p>
        ) : null}

        {actions ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">{actions}</div>
        ) : null}
      </div>

      {footer ? <div className="relative z-10 mt-10 w-full max-w-3xl min-w-0">{footer}</div> : null}
    </div>
  );
}
