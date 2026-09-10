import { BackgroundRippleEffect } from "@/components/acceternity/background-ripple-effect";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { landingRippleToneClassName } from "@/lib/landing/rippleTone";
import { AppConfig } from "@/utils/system";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/auth/desktop-done/")({
  component: DesktopAuthDonePage,
  head: () => ({
    meta: [{ title: `Signed in | ${AppConfig.name}` }],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap",
      },
    ],
  }),
});

function DesktopAuthDonePage() {
  const Icon = AppConfig.icon;

  useEffect(() => {
    // Best-effort: browsers often block this unless the tab was script-opened.
    window.close();
  }, []);

  return (
    <div className="landing-page flex min-h-svh flex-col" data-test="auth-desktop-done">
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link
          to="/"
          className="landing-display text-landing-fg flex items-center gap-2.5 text-lg font-bold tracking-tight"
          data-test="auth-desktop-done-brand"
        >
          <span className="bg-landing-amber/15 text-landing-amber flex size-9 items-center justify-center rounded-xl">
            <Icon className="size-5" aria-hidden />
          </span>
          <span>
            {AppConfig.name}
            <span className="text-landing-amber">.</span>
          </span>
        </Link>
        <ThemeToggle
          showDevSelect={false}
          className="border-landing-border bg-landing-surface-raised text-landing-fg hover:bg-landing-surface-alt size-8 min-h-8"
        />
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
        <BackgroundRippleEffect
          rows={14}
          cols={16}
          cellSize={44}
          pulse
          pulseInterval={3600}
          pulseTarget="random"
          className={landingRippleToneClassName}
        />
        <div className="from-landing-surface via-landing-surface/50 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent" />
        <div className="relative z-10 w-full max-w-md text-center">
          <CheckCircle2
            className="text-landing-amber mx-auto size-12"
            aria-hidden
            strokeWidth={1.5}
          />
          <h1 className="landing-display text-landing-fg mt-6 text-3xl font-bold tracking-[-0.03em]">
            You&apos;re signed in
            <span className="text-landing-amber">.</span>
          </h1>
          <p className="text-landing-fg-muted mt-3 text-sm leading-6">
            Return to the Tangerine Desktop window. You can close this browser tab — signing in
            again here can break the desktop handoff.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              className="landing-cta-primary"
              data-test="auth-desktop-done-close"
              onClick={() => {
                window.close();
              }}
            >
              Close this tab
            </button>
            <Link to="/" className="landing-cta-secondary" data-test="auth-desktop-done-home">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
