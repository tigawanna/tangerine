import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";

export function LandingFooter() {
  const year = new Date().getFullYear();
  const Icon = AppConfig.icon;

  return (
    <footer className="border-landing-border bg-landing-surface text-landing-fg border-t px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-5" aria-hidden />
          <div>
            <p className="landing-display text-landing-fg font-bold lowercase">
              {AppConfig.name.toLowerCase()}
            </p>
            <p className="text-landing-fg-muted text-sm">{AppConfig.brief}</p>
          </div>
        </div>

        <nav aria-label="Footer" className="text-landing-fg-muted flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link to="/repos" className="hover:text-landing-fg">
            Repos
          </Link>
          <Link to="/stars" className="hover:text-landing-fg">
            Stars
          </Link>
          <a
            href={AppConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-landing-fg"
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
