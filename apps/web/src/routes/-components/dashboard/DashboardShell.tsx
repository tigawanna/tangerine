import { Footer } from "@/components/navigation/Footer";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const Icon = AppConfig.icon;

  return (
    <div className="bg-base-100 text-base-content min-h-screen">
      <header className="border-base-300 bg-base-200/80 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Icon className="text-primary size-7" aria-hidden />
            <div>
              <Link to="/" className="text-lg font-semibold tracking-tight">
                {AppConfig.name}
              </Link>
              <p className="text-base-content/60 text-xs">{AppConfig.brief}</p>
            </div>
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {AppConfig.navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="btn btn-ghost btn-sm"
                data-test={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              href={AppConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              data-test="nav-github-profile"
            >
              Profile
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>

      <Footer />
    </div>
  );
}
