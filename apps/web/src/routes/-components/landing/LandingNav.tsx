import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

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
            search={{ returnTo: "/viewer" }}
            className="landing-cta-primary landing-cta-icon"
            aria-label="Sign in with GitHub"
            title="Sign in with GitHub"
            data-test="landing-nav-get-started"
          >
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
