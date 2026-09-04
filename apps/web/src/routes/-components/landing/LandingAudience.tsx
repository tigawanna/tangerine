import { Link } from "@tanstack/react-router";

export function LandingAudience() {
  return (
    <section
      id="product"
      className="bg-landing-surface text-landing-fg px-4 py-16 sm:px-6 md:py-20"
      data-test="landing-audience"
    >
      <div className="landing-scroll-reveal mx-auto max-w-6xl">
        <p className="text-landing-ember text-center text-sm font-semibold tracking-[0.16em] uppercase">
          For builders who live in repos
        </p>
        <h2 className="landing-display text-landing-fg mx-auto mt-4 max-w-3xl text-center text-3xl font-bold tracking-[-0.03em] md:text-4xl">
          Freelancers, maintainers, and small teams who want signal over chrome.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="landing-audience-card landing-audience-card-emphasis">
            <h3 className="landing-display text-2xl font-bold">Solo developers</h3>
            <p className="mt-3 max-w-md text-sm leading-7 opacity-75">
              Scan pinned work and recent pushes without hunting through GitHub&apos;s denser surfaces.
              One Get Started click lands you in repos.
            </p>
            <Link to="/repos" className="landing-cta-primary mt-8" data-test="landing-audience-solo">
              Get Started
            </Link>
          </div>
          <div className="landing-audience-card landing-audience-card-raised">
            <h3 className="landing-display text-2xl font-bold">Teams &amp; open source</h3>
            <p className="text-landing-fg-muted mt-3 max-w-md text-sm leading-7">
              Keep starred references next to your own repositories. Less context switching when
              reviewing dependencies and inspiration.
            </p>
            <Link to="/stars" className="landing-cta-ghost mt-8" data-test="landing-audience-teams">
              Explore stars
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
