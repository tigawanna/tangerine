import { techChoices } from "../../config/info";
import { ClientOnly } from "../../stubs/client-only";
import { LandingSection, SectionEyebrow } from "../../primitives";
import { LandingFeatures } from "./LandingFeatures";

function LandingFeaturesFallback() {
  const firstChoice = techChoices[0];

  return (
    <LandingSection
      id="skills"
      tone="olive"
      dataTest="landing-tech-choices"
      className="bg-landing-face-3 py-20 text-landing-cream lg:overflow-hidden"
    >
      <div className="container relative z-10">
        <div className="mx-auto max-w-xl">
          <SectionEyebrow>Why I choose what I choose</SectionEyebrow>
          <h2 className="landing-section-heading">Ten tools, one reasoned stack at a time.</h2>
        </div>
        {firstChoice ? (
          <div className="mx-auto mt-10 max-w-xl rounded-none border border-landing-cream/12 bg-landing-panel/82 p-8 shadow-xl shadow-black/20">
            <p className="text-xs tracking-[0.28em] text-landing-sage/50 uppercase">
              {firstChoice.category}
            </p>
            <h3 className="mt-3 font-serif text-3xl font-medium tracking-[-0.03em]">
              {firstChoice.name}
            </h3>
            <p className="mt-4 text-sm leading-7 text-landing-sage/75">{firstChoice.summary}</p>
          </div>
        ) : null}
      </div>
    </LandingSection>
  );
}

export function LandingFeaturesDeferred() {
  return (
    <ClientOnly fallback={<LandingFeaturesFallback />}>
      <LandingFeatures />
    </ClientOnly>
  );
}
