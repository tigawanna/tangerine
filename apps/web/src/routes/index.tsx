import { LandingClosingCta } from "@/routes/-components/landing/LandingClosingCta";
import { LandingFeatures } from "@/routes/-components/landing/LandingFeatures";
import { LandingFooter } from "@/routes/-components/landing/LandingFooter";
import { LandingHero } from "@/routes/-components/landing/LandingHero";
import { LandingNav } from "@/routes/-components/landing/LandingNav";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap",
      },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="landing-page min-h-screen" data-test="landing-page">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
