import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function LandingClosingCta() {
  return (
    <section className="bg-landing-surface px-4 py-16 sm:px-6 md:py-24">
      <div className="landing-scroll-reveal bg-landing-surface-alt text-landing-fg relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-14 text-center md:px-12 md:py-16">
        <h2 className="landing-display mx-auto max-w-2xl text-3xl font-bold tracking-[-0.03em] md:text-5xl">
          Ready to browse your repos?
        </h2>
        <p className="text-landing-fg-muted mx-auto mt-4 max-w-lg text-base leading-7">
          Jump into the dashboard — pinned and recent repositories are waiting.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/repos" className="landing-cta-primary" data-test="landing-closing-get-started">
            Get Started
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link to="/stars" className="landing-cta-secondary" data-test="landing-closing-stars">
            Or open stars
          </Link>
        </div>
      </div>
    </section>
  );
}
