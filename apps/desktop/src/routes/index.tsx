import { LandingClosingCta } from "@/routes/-components/landing/LandingClosingCta";
import { LandingFeatures } from "@/routes/-components/landing/LandingFeatures";
import { LandingFooter } from "@/routes/-components/landing/LandingFooter";
import { LandingHero } from "@/routes/-components/landing/LandingHero";
import { LandingNav } from "@/routes/-components/landing/LandingNav";
import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";

const landingTitle = `${AppConfig.name} | GitHub dashboard without the reload tax`;
const landingDescription =
  "Browse GitHub repos and stars in a fast SPA shell. Ergonomic search, follow-graph hopping, bulk follow-back, and bulk repo cleanup without GitHub’s clunky full-page UI.";
const landingKeywords =
  "tangerine, github dashboard, github stars, repository browser, github search, bulk follow back, bulk delete repos, spa, relay, tanstack";
const landingOgImage = AppConfig.absoluteAsset(AppConfig.assets.ogImage);
const landingOgAlt = `${AppConfig.name}: browse GitHub repos, stars, and search in a quieter SPA dashboard`;

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: landingTitle },
      { name: "description", content: landingDescription },
      { name: "keywords", content: landingKeywords },
      { name: "robots", content: "index, follow" },
      { property: "og:site_name", content: AppConfig.name },
      { property: "og:title", content: landingTitle },
      { property: "og:description", content: landingDescription },
      { property: "og:url", content: AppConfig.links.website },
      { property: "og:type", content: "website" },
      { property: "og:image", content: landingOgImage },
      { property: "og:image:width", content: "1280" },
      { property: "og:image:height", content: "720" },
      { property: "og:image:alt", content: landingOgAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@tigawanna" },
      { name: "twitter:creator", content: "@tigawanna" },
      { name: "twitter:title", content: landingTitle },
      { name: "twitter:description", content: landingDescription },
      { name: "twitter:image", content: landingOgImage },
      { name: "twitter:image:alt", content: landingOgAlt },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap",
      },
      { rel: "canonical", href: AppConfig.links.website },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: AppConfig.name,
          url: AppConfig.links.website,
          description: landingDescription,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          creator: {
            "@type": "Person",
            name: "Dennis Waweru",
            url: "https://github.com/tigawanna",
          },
        }),
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
