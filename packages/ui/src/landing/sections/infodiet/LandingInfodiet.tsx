import { infoDietSources } from "../../config/info";
import { InfoDietCard } from "../../cards/InfoDietCard";
import { LandingSection, OrganicDivider, SectionEyebrow } from "../../primitives";

export function LandingInfodiet() {
  return (
    <LandingSection
      id="infodiet"
      tone="panel"
      className="text-base-content"
      dataTest="landing-infodiet"
    >
      <OrganicDivider tone="panel" />
      <OrganicDivider tone="panel" flip />

      <div className="container relative z-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <SectionEyebrow>Infodiet</SectionEyebrow>
          <h2 className="landing-section-heading">Where most of my signal comes from.</h2>
          <p className="landing-section-lead">
            Podcasts and reads I keep in rotation — the shows and blogs I reach for when I want to
            stay current without doomscrolling.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {infoDietSources.map((source) => (
            <InfoDietCard key={source.id} source={source} />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
