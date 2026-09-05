import { Link } from "@tanstack/react-router";
import { LandingShotPlaceholder } from "./LandingShotPlaceholder";

const features = [
  {
    title: "Repositories",
    body: "Pinned and recent repos in a clean grid. Jump straight into what you are shipping.",
    href: "/viewer" as const,
    shot: "Repos grid UI",
  },
  {
    title: "Stars",
    body: "Your starred projects beside your own work. No more tab hopping.",
    href: "/viewer" as const,
    shot: "Stars list UI",
  },
  {
    title: "Local-first speed",
    body: "Built for fast navigation on your machine. Less waiting on GitHub chrome.",
    href: "/viewer" as const,
    shot: "Fast local navigation",
  },
  {
    title: "Desktop embeddings",
    body: "Coming later: index repos and stars for smarter search. Same idea, deeper reach.",
    href: "/viewer" as const,
    shot: "Desktop search placeholder",
    badge: "Soon",
  },
] as const;

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="bg-landing-surface text-landing-fg px-4 py-20 sm:px-6 md:py-28"
      data-test="landing-features"
    >
      <div className="landing-scroll-reveal mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="landing-section-heading">Made for developers who live in repos</h2>
          <p className="landing-section-lead mx-0! text-left">
            A quieter shell for browsing GitHub. Local-first so it feels instant.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="landing-feature-tile landing-scroll-reveal-fade flex flex-col"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="landing-display text-landing-fg text-xl font-bold tracking-tight">
                  {feature.title}
                </h3>
                {"badge" in feature && feature.badge ? (
                  <span className="bg-landing-surface-alt text-landing-fg-muted shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase">
                    {feature.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-landing-fg-muted mt-3 flex-1 text-sm leading-7">{feature.body}</p>
              <div className="mt-6 overflow-hidden rounded-xl">
                <LandingShotPlaceholder label={feature.shot} aspect="wide" className="min-h-35" />
              </div>
              <Link
                to={feature.href}
                className="text-landing-fg mt-5 inline-flex text-sm font-semibold hover:underline"
                data-test={`landing-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                Open {feature.title === "Desktop embeddings" ? "repos" : feature.title.toLowerCase()}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
