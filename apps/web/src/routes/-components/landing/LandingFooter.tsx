import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";

export function LandingFooter() {
  const year = new Date().getFullYear();
  const Icon = AppConfig.icon;

  return (
    <footer className="border-landing-border bg-landing-surface-alt text-landing-fg border-t px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Icon className="text-landing-amber size-7" aria-hidden />
          <div>
            <p className="landing-display text-landing-fg font-bold">
              {AppConfig.name}
              <span className="text-landing-ember">.</span>
            </p>
            <p className="text-landing-fg-muted text-sm">{AppConfig.brief}</p>
          </div>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4 text-sm">
          <Link to="/repos" className="text-landing-fg-muted hover:text-landing-fg">
            Repos
          </Link>
          <Link to="/stars" className="text-landing-fg-muted hover:text-landing-fg">
            Stars
          </Link>
          <a
            href={AppConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-landing-fg-muted hover:text-landing-fg"
          >
            GitHub
          </a>
        </nav>
        <p className="text-landing-fg-muted text-xs">
          © {year} {AppConfig.name}
        </p>
      </div>
    </footer>
  );
}
