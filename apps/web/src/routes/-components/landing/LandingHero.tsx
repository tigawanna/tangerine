import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LandingMockProfilePreview } from "./mock/LandingMockPreviews";

export function LandingHero() {
  return (
    <section className="bg-landing-surface text-landing-fg relative overflow-hidden pt-28 pb-10 md:pt-36 md:pb-16">
      <div className="landing-glow landing-glow-hero" aria-hidden />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h1 className="landing-display landing-hero-enter text-[clamp(2.5rem,6vw,4rem)] leading-[1.05] font-extrabold tracking-[-0.035em]">
          {AppConfig.name}
        </h1>

        <p className="landing-hero-enter landing-hero-enter-delay-1 text-landing-fg-muted mx-auto mt-5 max-w-lg text-lg leading-8">
          Browse your GitHub repos and stars without the full-page reload tax.
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
        <div
          className="landing-browser"
          data-test="landing-hero-preview"
          role="img"
          aria-label={`${AppConfig.name} profile preview with sample repositories`}
        >
          <div className="landing-browser-bar">
            <span className="landing-browser-dot" />
            <span className="landing-browser-dot" />
            <span className="landing-browser-dot" />
            <span className="text-landing-fg-muted ml-2 text-xs">
              {AppConfig.name.toLowerCase()} · johndoe
            </span>
          </div>
          <div className="relative max-h-96 overflow-hidden md:max-h-[35rem]">
            <LandingMockProfilePreview />
            <div
              className="from-base-100 pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t to-transparent md:h-24"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}
