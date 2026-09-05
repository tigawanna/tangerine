import { BackgroundRippleEffect } from "@/components/acceternity/background-ripple-effect";
import { AppBrandIcon } from "@/components/icon/AppBrandIcon";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { landingRippleToneClassName } from "@/lib/landing/rippleTone";
import { cn } from "@/lib/utils";
import { GitHubSignIn } from "@/routes/auth/-components/GitHubSignIn";
import { AppConfig } from "@/utils/system";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

type AuthSignInScreenProps = {
  returnTo: string;
};

export function AuthSignInScreen({ returnTo }: AuthSignInScreenProps) {
  const Icon = AppConfig.icon;

  return (
    <div className="landing-page flex min-h-svh flex-col" data-test="auth-page">
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link
          to="/"
          className="landing-display text-landing-fg flex items-center gap-2.5 text-lg font-bold tracking-tight"
          data-test="auth-brand"
        >
          <span className="bg-landing-amber/15 text-landing-amber flex size-9 items-center justify-center rounded-xl">
            <Icon className="size-5" aria-hidden />
          </span>
          <span>
            {AppConfig.name}
            <span className="text-landing-amber">.</span>
          </span>
        </Link>
        <ThemeToggle
          showDevSelect={false}
          className="border-landing-border bg-landing-surface-raised text-landing-fg hover:bg-landing-surface-alt size-8 min-h-8"
        />
      </header>

      <main className="relative grid flex-1 lg:grid-cols-2">
        <section className="border-landing-border relative hidden min-h-0 overflow-hidden border-r lg:block">
          <BackgroundRippleEffect
            rows={16}
            cols={18}
            cellSize={44}
            pulse
            pulseInterval={3600}
            pulseTarget="random"
            className={landingRippleToneClassName}
          />
          <div className="from-landing-surface via-landing-surface/40 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent" />
          <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end gap-10 p-10 xl:gap-12 xl:p-14">
            <AppBrandIcon size={168} className="drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]" />
            <div>
              <h1 className="landing-display text-landing-fg max-w-md text-4xl leading-[1.02] font-extrabold tracking-[-0.035em] xl:text-5xl">
                Browse repos
                <br />
                without the noise
                <span className="text-landing-amber">.</span>
              </h1>
              <p className="text-landing-fg-muted mt-4 max-w-sm text-base leading-7">
                {AppConfig.brief}
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
          <BackgroundRippleEffect
            rows={14}
            cols={12}
            cellSize={44}
            pulse
            pulseInterval={3600}
            pulseTarget="random"
            className={cn("lg:hidden", landingRippleToneClassName)}
          />
          <div className="from-landing-surface via-landing-surface/50 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent lg:hidden" />
          <div className="relative z-10 w-full max-w-sm">
            <h2 className="landing-display text-landing-fg text-2xl font-bold tracking-[-0.03em] lg:text-3xl">
              Sign in
            </h2>
            <p className="text-landing-fg-muted mt-2 text-sm leading-6">
              Continue with GitHub to open your repos and stars.
            </p>
            <div className="mt-8 space-y-3">
              <GitHubSignIn callbackURL={returnTo} />
              <Link to="/" className="landing-cta-secondary w-full" data-test="auth-back-home">
                <ArrowLeft className="size-4" aria-hidden />
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
