import { Link } from "@tanstack/react-router";
import { GitFork, LayoutDashboard, Star } from "lucide-react";

const features = [
  {
    icon: GitFork,
    title: "Repositories",
    body: "Pinned highlights and recently updated repos in a clean grid — jump straight into what you are shipping.",
    href: "/repos" as const,
    cta: "Open repos",
  },
  {
    icon: Star,
    title: "Stars",
    body: "Keep favorites close. Browse starred projects beside your own work without tab chaos.",
    href: "/stars" as const,
    cta: "Browse stars",
  },
  {
    icon: LayoutDashboard,
    title: "Focused shell",
    body: "Collapsible sidebar, breadcrumbs, and theme control so the workspace stays out of your way.",
    href: "/repos" as const,
    cta: "Enter dashboard",
  },
] as const;

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="bg-landing-surface-alt text-landing-fg px-4 py-20 sm:px-6 md:py-28"
      data-test="landing-features"
    >
      <div className="landing-scroll-reveal mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="landing-section-heading">Built for the browsing loop</h2>
          <p className="landing-section-lead !mx-0 text-left">
            Same job as GitHub&apos;s lists — fewer distractions. Start in repos, peek at stars, stay in
            flow.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="landing-feature-tile landing-scroll-reveal-fade">
              <div className="bg-landing-amber/15 text-landing-amber mb-5 inline-flex size-11 items-center justify-center rounded-2xl">
                <feature.icon className="size-5" aria-hidden />
              </div>
              <h3 className="landing-display text-landing-fg text-xl font-bold tracking-tight">
                {feature.title}
              </h3>
              <p className="text-landing-fg-muted mt-3 text-sm leading-7">{feature.body}</p>
              <Link
                to={feature.href}
                className="text-landing-ember mt-6 inline-flex text-sm font-semibold hover:underline"
                data-test={`landing-feature-${feature.title.toLowerCase()}`}
              >
                {feature.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
