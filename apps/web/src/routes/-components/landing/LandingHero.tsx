import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LandingShotPlaceholder } from "./LandingShotPlaceholder";

export function LandingHero() {
  return (
    <section className="bg-landing-surface text-landing-fg relative overflow-hidden pt-28 pb-10 md:pt-36 md:pb-16">
      <div className="landing-glow landing-glow-hero" aria-hidden />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h1 className="landing-display landing-hero-enter text-[clamp(2.5rem,6vw,4rem)] leading-[1.05] font-extrabold tracking-[-0.035em]">
          {AppConfig.name}
        </h1>

        <p className="landing-hero-enter landing-hero-enter-delay-1 text-landing-fg-muted mx-auto mt-5 max-w-lg text-lg leading-8">
          Local-first browsing for your GitHub repos and stars. Faster navigation, less noise.
        </p>

        <div className="landing-hero-enter landing-hero-enter-delay-2 mt-8">
          <Link
            to="/auth"
            search={{ returnTo: "/viewer" }}
            className="landing-cta-primary"
            data-test="landing-hero-get-started"
          >
            Get started
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="landing-hero-enter landing-hero-enter-delay-3 landing-proof-float relative z-10 mx-auto mt-12 max-w-5xl px-4 sm:px-6 md:mt-16">
        <div className="landing-browser" data-test="landing-hero-preview">
          <div className="landing-browser-bar">
            <span className="landing-browser-dot" />
            <span className="landing-browser-dot" />
            <span className="landing-browser-dot" />
            <span className="text-landing-fg-muted ml-2 text-xs">
              {AppConfig.name.toLowerCase()}
            </span>
          </div>
          <LandingShotPlaceholder
            label="App screenshot placeholder"
            aspect="video"
            className="min-h-55 rounded-none border-0 border-t border-dashed md:min-h-90"
          />
        </div>
      </div>
    </section>
  );
}
