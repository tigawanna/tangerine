import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Repos", to: "/repos" as const },
  { label: "Stars", to: "/stars" as const },
] as const;

export function LandingNav() {
  const Icon = AppConfig.icon;

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link
          to="/"
          className="landing-display text-landing-fg flex items-center gap-2.5 text-lg font-bold tracking-tight"
          data-test="landing-brand"
        >
          <span className="bg-landing-amber/15 text-landing-amber flex size-9 items-center justify-center rounded-xl">
            <Icon className="size-5" aria-hidden />
          </span>
          <span>
            {AppConfig.name}
            <span className="text-landing-amber">.</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) =>
            "to" in item ? (
              <Link
                key={item.label}
                to={item.to}
                className="text-landing-fg-muted hover:text-landing-fg rounded-full px-3 py-2 text-sm font-medium transition-colors"
                data-test={`landing-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-landing-fg-muted hover:text-landing-fg rounded-full px-3 py-2 text-sm font-medium transition-colors"
                data-test={`landing-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

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
