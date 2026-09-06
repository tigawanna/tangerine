import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";
import { ArrowRight, GitFork, Star, Zap } from "lucide-react";

const perks = [
  { icon: GitFork, label: "Your repos" },
  { icon: Star, label: "Your stars" },
  { icon: Zap, label: "Intelligent loading" },
] as const;

export function LandingClosingCta() {
  return (
    <section
      className="bg-landing-surface-alt text-landing-fg"
      data-test="landing-closing"
    >
      <div className="landing-scroll-reveal mx-auto grid max-w-6xl items-end gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16 md:py-24">
        <div className="max-w-xl">
          <p className="landing-display text-landing-amber text-sm font-semibold tracking-[0.2em] uppercase">
            {AppConfig.name}
          </p>
          <h2 className="landing-display text-landing-fg mt-3 text-[clamp(1.85rem,4.5vw,3rem)] leading-[1.08] font-bold tracking-[-0.035em]">
            Ready when you are.
            <br />
            Your repos, one click away.
          </h2>
          <p className="text-landing-fg-muted mt-4 max-w-md text-base leading-7">
            Sign in with GitHub and land in a quieter shell with fast SPA navigation.
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
        </div>

        <ul className="flex flex-col gap-3 md:pb-1">
          {perks.map((perk) => (
            <li
              key={perk.label}
              className="text-landing-fg-muted inline-flex items-center gap-2.5 text-sm font-medium"
            >
              <perk.icon className="text-landing-amber size-4 shrink-0" aria-hidden />
              {perk.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
