import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";
import { ArrowRight, GitFork, Star, Zap } from "lucide-react";

const perks = [
  { icon: GitFork, label: "Your repos" },
  { icon: Star, label: "Your stars" },
  { icon: Zap, label: "Local-first speed" },
] as const;

export function LandingClosingCta() {
  const Icon = AppConfig.icon;

  return (
    <section className="bg-landing-surface px-4 py-16 sm:px-6 md:py-24" data-test="landing-closing">
      <div className="landing-scroll-reveal landing-closing-panel relative mx-auto max-w-5xl overflow-hidden px-6 py-14 text-center sm:px-10 md:px-16 md:py-20">
        <div className="landing-glow landing-glow-cta" aria-hidden />
        <div className="landing-closing-ring" aria-hidden />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-landing-amber/15 text-landing-amber mb-6 flex size-14 items-center justify-center rounded-2xl">
            <Icon className="size-8" aria-hidden />
          </div>

          <p className="landing-display text-landing-amber text-sm font-semibold tracking-[0.2em] uppercase">
            {AppConfig.name}
          </p>

          <h2 className="landing-display text-landing-fg mx-auto mt-3 max-w-2xl text-[clamp(1.85rem,4.5vw,3rem)] font-bold tracking-[-0.035em]">
            Ready when you are.
            <br />
            Your repos, one click away.
          </h2>

          <p className="text-landing-fg-muted mx-auto mt-4 max-w-md text-base leading-7">
            Sign in with GitHub and land in a quieter shell built for fast, local-first browsing.
          </p>

          <div className="mt-8">
            <Link
              to="/auth"
              search={{ returnTo: "/viewer" }}
              className="landing-cta-primary"
              data-test="landing-closing-get-started"
            >
              Get started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {perks.map((perk) => (
              <li
                key={perk.label}
                className="text-landing-fg-muted inline-flex items-center gap-2 text-sm font-medium"
              >
                <perk.icon className="text-landing-amber size-4" aria-hidden />
                {perk.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
