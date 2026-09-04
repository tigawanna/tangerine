import { CreatureEggLowercaseI } from "../../stubs/creature-egg";
import { AppConfig } from "../../config/system";
import { HeroIllustration } from "./HeroIllustration";

export function LandingHero() {
  return (
    <section
      data-test="landing-hero"
      className="landing-void-surface relative flex min-h-svh flex-col items-center justify-start overflow-hidden px-6 pt-40 pb-24 md:pt-48 lg:pt-[min(34vh,18rem)] lg:pb-28"
    >
      <div className="landing-hero-glow pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center text-center">
        <h1 className="w-full font-serif text-7xl leading-[0.9] font-medium tracking-[-0.04em] md:text-8xl lg:text-[7rem] lg:whitespace-nowrap xl:text-[8.5rem] 2xl:text-[9rem]">
          Denn
          <CreatureEggLowercaseI />s Waweru
        </h1>

        <p className="mt-6 w-full font-serif text-xl tracking-[0.02em] text-landing-sage/85 md:mt-8 md:text-2xl lg:mt-6 lg:text-center">
          {AppConfig.brief}
        </p>

        <div className="mt-10 w-full max-w-md md:mt-12 lg:mt-10">
          <svg
            viewBox="0 0 400 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-6 w-full max-w-sm text-landing-sage/35"
            aria-hidden="true"
          >
            <path
              d="M0 14C60 4 120 22 200 12C280 2 340 20 400 10"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>

          <p className="mt-5 text-sm leading-7 text-landing-sage/65 md:text-base lg:max-w-sm">
            {AppConfig.description}
          </p>
        </div>

        <div
          className="mt-16 flex w-full items-center justify-center gap-8 text-landing-sage/70 md:mt-20 lg:mt-16"
          aria-hidden="true"
        >
          <div className="h-px w-16 bg-landing-sage/20 md:w-24" />
          <HeroIllustration />
          <div className="h-px w-16 bg-landing-sage/20 md:w-24" />
        </div>
      </div>
    </section>
  );
}
