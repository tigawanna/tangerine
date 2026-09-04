import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";

export function LandingNav() {
  const Icon = AppConfig.icon;

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link
          to="/"
          className="landing-display text-landing-fg flex items-center gap-2 text-lg font-bold tracking-tight lowercase"
          data-test="landing-brand"
        >
          <Icon className="size-5" aria-hidden />
          <span>{AppConfig.name.toLowerCase()}</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle
            showDevSelect={false}
            className="border-landing-border bg-landing-surface-raised text-landing-fg hover:bg-landing-surface-alt size-8 min-h-8"
          />
          <Link
            to="/auth"
            search={{ returnTo: "/repos" }}
            className="landing-cta-primary landing-cta-compact"
            data-test="landing-nav-get-started"
          >
            Sign in with GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}
