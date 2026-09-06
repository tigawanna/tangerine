import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";
import { TigawannaCredit } from "@tigawanna/credit";
import "@tigawanna/credit/styles.css";

export function LandingFooter() {
  const year = new Date().getFullYear();
  const Icon = AppConfig.icon;

  return (
    <footer className="bg-landing-footer text-landing-fg px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex items-center gap-2.5">
          <Icon className="size-5" aria-hidden />
          <p className="landing-display text-landing-fg font-bold lowercase">
            {AppConfig.name.toLowerCase()}
          </p>
        </div>

        <div className="border-landing-border flex flex-col gap-6 border-t pt-8 md:flex-row md:items-start md:justify-between">
          <p className="text-landing-fg-muted max-w-sm text-sm leading-6">{AppConfig.brief}</p>

          <nav aria-label="Footer" className="text-landing-fg-muted flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link to="/viewer" className="hover:text-landing-fg">
              Dashboard
            </Link>
            <Link to="/auth" search={{ returnTo: "/viewer" }} className="hover:text-landing-fg">
              Sign in
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

          <p className="text-landing-fg-muted text-xs md:text-right">
            © {year} {AppConfig.name}
          </p>
        </div>

        <TigawannaCredit />
      </div>
    </footer>
  );
}
