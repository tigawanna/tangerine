import { Link } from "@tanstack/react-router";
import { ArrowRight, GitFork, Star } from "lucide-react";

export function LandingHero() {
  return (
    <section className="bg-landing-surface text-landing-fg relative overflow-hidden pt-28 pb-16 md:pt-32 md:pb-24">
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-10">
        <div className="max-w-xl">
          <p className="landing-hero-enter text-landing-ember text-sm font-semibold tracking-[0.18em] uppercase">
            GitHub, calmer
          </p>
          <h1 className="landing-display landing-hero-enter landing-hero-enter-delay-1 mt-4 text-[clamp(2.5rem,6vw,4.25rem)] leading-[0.98] font-extrabold tracking-[-0.035em]">
            Browse repos
            <br />
            without the noise.
          </h1>
          <p className="landing-hero-enter landing-hero-enter-delay-2 text-landing-fg-muted mt-5 max-w-md text-lg leading-8">
            A focused dashboard for your repositories and stars — pinned highlights, recent pushes,
            and favorites in one warm workspace.
          </p>
          <div className="landing-hero-enter landing-hero-enter-delay-3 mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              search={{ returnTo: "/repos" }}
              className="landing-cta-primary"
              data-test="landing-hero-get-started"
            >
              Sign in with GitHub
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link to="/stars" className="landing-cta-secondary" data-test="landing-hero-stars">
              View stars
            </Link>
          </div>
        </div>

        <div className="landing-hero-enter landing-hero-enter-delay-2 landing-proof-float lg:justify-self-end">
          <LandingProductPreview />
        </div>
      </div>
    </section>
  );
}

function LandingProductPreview() {
  return (
    <div
      className="landing-proof-shell w-full max-w-md overflow-hidden rounded-3xl p-3 sm:max-w-lg"
      aria-hidden
    >
      <div className="bg-landing-surface text-landing-fg overflow-hidden rounded-[1.1rem]">
        <div className="border-landing-border flex items-center gap-2 border-b px-4 py-3">
          <span className="bg-landing-flame size-2.5 rounded-full" />
          <span className="bg-landing-orange size-2.5 rounded-full" />
          <span className="bg-landing-amber size-2.5 rounded-full" />
          <span className="text-landing-fg-muted ml-2 text-xs">Repos · dashboard</span>
        </div>
        <div className="grid grid-cols-[4.5rem_1fr] sm:grid-cols-[5.5rem_1fr]">
          <aside className="border-landing-border bg-landing-surface-alt border-r p-3">
            <div className="bg-landing-amber/20 mb-4 size-7 rounded-lg" />
            <div className="space-y-2">
              <div className="text-landing-ember flex items-center gap-2 rounded-lg bg-landing-amber/15 px-2 py-1.5 text-[10px]">
                <GitFork className="size-3" />
                Repos
              </div>
              <div className="text-landing-fg-muted flex items-center gap-2 px-2 py-1.5 text-[10px]">
                <Star className="size-3" />
                Stars
              </div>
            </div>
          </aside>
          <div className="space-y-3 p-4">
            <div>
              <p className="text-landing-fg-muted text-[10px] tracking-[0.16em] uppercase">Pinned</p>
              <p className="mt-1 text-sm font-semibold">Your repos</p>
            </div>
            <div className="grid gap-2">
              {["tigawanna", "shift-sync", "creature-egg"].map((name) => (
                <div
                  key={name}
                  className="border-landing-border bg-landing-surface-raised rounded-xl border px-3 py-2.5"
                >
                  <p className="text-xs font-semibold">{name}</p>
                  <p className="text-landing-fg-muted mt-1 text-[10px]">Updated recently · ★ active</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
