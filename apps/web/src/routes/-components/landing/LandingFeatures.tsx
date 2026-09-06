import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  LandingMockBulkDeletePreview,
  LandingMockGithubSearchPreview,
  LandingMockGraphPreview,
  LandingMockReposPreview,
  LandingMockSearchPreview,
  LandingMockSpeedPreview,
  LandingMockStarsPreview,
} from "./mock/LandingMockPreviews";

const features = [
  {
    title: "Repositories",
    body: "See a quick overview of each repository at a single glance: activity, stars, forks, and languages, with commonly used filters you can add in a simple, ergonomic way.",
    href: "/viewer" as const,
    preview: <LandingMockReposPreview className="min-h-48 md:min-h-64" />,
    openLabel: "Open repositories",
  },
  {
    title: "Stars",
    body: "A tab away, everything loads pretty quick, and ergonomic filters let you do most of your work without reloading the full page or dealing with GitHub’s clunky UI.",
    href: "/viewer" as const,
    preview: <LandingMockStarsPreview className="min-h-48 md:min-h-64" />,
    openLabel: "Open stars",
  },
  {
    title: "Follow the graph",
    body: "Hop from a follower to their projects, peek their repos, open their followers, and keep pulling that thread. Follow, unfollow, and follow back without breaking stride.",
    href: "/viewer" as const,
    preview: <LandingMockGraphPreview className="min-h-48 md:min-h-64" />,
    openLabel: "Open followers",
  },
  {
    title: "Ergonomic search",
    body: "A keyboard-first search bar with a visual GitHub query editor — compose language, stars, owners, and more without memorizing qualifier syntax.",
    href: "/viewer" as const,
    preview: <LandingMockGithubSearchPreview className="min-h-48 md:min-h-64" />,
    openLabel: "Try search",
  },
  {
    title: "Bulk deletion",
    body: "Skip GitHub’s one-at-a-time delete hoops. Wipe dozens of repos in the time it takes to approve a single deletion over there. Use with caution 🙂",
    href: "/viewer" as const,
    preview: <LandingMockBulkDeletePreview className="min-h-48 md:min-h-64" />,
    openLabel: "Open repositories",
  },
  {
    title: "Intelligent loading",
    body: "A Relay-powered SPA that preloads what you need and skips full-page reloads between views.",
    href: "/viewer" as const,
    preview: <LandingMockSpeedPreview className="min-h-48 md:min-h-64" />,
    openLabel: "Open dashboard",
  },
  {
    title: "Natural language search",
    body: "Coming later: ask for the starred repo you mean in plain English — local RAG over your stars, not keyword bingo.",
    href: "/viewer" as const,
    preview: <LandingMockSearchPreview className="min-h-48 md:min-h-64" />,
    badge: "Soon",
    openLabel: "Open stars",
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
      className="bg-landing-surface text-landing-fg"
      data-test="landing-features"
    >
      <div className="landing-scroll-reveal mx-auto max-w-6xl px-4 pt-20 sm:px-6 md:pt-28">
        <div className="max-w-2xl">
          <h2 className="landing-section-heading">Made for developers who live in repos</h2>
          <p className="landing-section-lead mx-0! text-left">
            A quieter shell for browsing GitHub. Fast SPA navigation without full-page reloads.
          </p>
        </div>
      </div>

      <div className="mt-10 md:mt-16">
        {features.map((feature, index) => {
          const mediaFirst = index % 2 === 0;

          return (
            <article
              key={feature.title}
              className={cn(
                "landing-scroll-reveal-fade border-landing-border border-t",
                index % 2 === 1 && "bg-landing-surface-alt/40",
              )}
            >
              <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-14 md:py-20">
                {mediaFirst ? (
                  <>
                    <FeatureMedia preview={feature.preview} />
                    <FeatureCopy feature={feature} />
                  </>
                ) : (
                  <>
                    <FeatureCopy feature={feature} />
                    <FeatureMedia preview={feature.preview} />
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type Feature = (typeof features)[number];

function FeatureMedia({ preview }: { preview: ReactNode }) {
  return (
    <div className="border-landing-border overflow-hidden rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.22)]">
      {preview}
    </div>
  );
}

function FeatureCopy({ feature }: { feature: Feature }) {
  return (
    <div className="flex min-w-0 flex-col items-start">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="landing-display text-landing-fg text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.1] font-bold tracking-[-0.03em]">
          {feature.title}
        </h3>
        {"badge" in feature && feature.badge ? (
          <span className="bg-landing-surface-raised text-landing-fg-muted shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase">
            {feature.badge}
          </span>
        ) : null}
      </div>
      <p className="text-landing-fg-muted mt-4 max-w-md text-base leading-7 md:text-lg md:leading-8">
        {feature.body}
      </p>
      <Link
        to={feature.href}
        className="landing-cta-primary mt-8"
        data-test={`landing-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {feature.openLabel}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
