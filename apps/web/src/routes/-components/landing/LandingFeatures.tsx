import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LandingMockReposPreview,
  LandingMockSearchPreview,
  LandingMockSpeedPreview,
  LandingMockStarsPreview,
} from "./mock/LandingMockPreviews";

const features = [
  {
    title: "Repositories",
    body: "Pinned and recent repos in a clean grid. Jump straight into what you are shipping.",
    href: "/viewer" as const,
    preview: <LandingMockReposPreview className="min-h-35" />,
    openLabel: "repositories",
  },
  {
    title: "Stars",
    body: "Your starred projects beside your own work. No more tab hopping.",
    href: "/viewer" as const,
    preview: <LandingMockStarsPreview className="min-h-35" />,
    openLabel: "stars",
  },
  {
    title: "Intelligent loading",
    body: "A Relay-powered SPA that preloads what you need and skips full-page reloads between views.",
    href: "/viewer" as const,
    preview: <LandingMockSpeedPreview className="min-h-35" />,
    openLabel: "dashboard",
  },
  {
    title: "Natural language search",
    body: "Coming later: ask for the starred repo you mean in plain English — local RAG over your stars, not keyword bingo.",
    href: "/viewer" as const,
    preview: <LandingMockSearchPreview className="min-h-35" />,
    badge: "Soon",
    openLabel: "stars",
  },
] as const satisfies ReadonlyArray<{
  title: string;
  body: string;
  href: "/viewer";
  preview: ReactNode;
  openLabel: string;
  badge?: string;
}>;

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
            A quieter shell for browsing GitHub. Fast SPA navigation without full-page reloads.
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
              <div className="border-landing-border mt-6 overflow-hidden rounded-xl border">
                {feature.preview}
              </div>
              <Link
                to={feature.href}
                className="text-landing-fg mt-5 inline-flex text-sm font-semibold hover:underline"
                data-test={`landing-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                Open {feature.openLabel}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
