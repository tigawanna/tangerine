import { LandingSection } from "../../primitives";
import { TechChoicesDesktop } from "./TechChoicesDesktop";
import { TechChoicesMobile } from "./TechChoicesMobile";

export function LandingFeatures() {
  return (
    <LandingSection
      id="skills"
      tone="olive"
      dataTest="landing-tech-choices"
      className="bg-landing-face-3 py-0 text-landing-cream lg:overflow-hidden"
    >
      <TechChoicesDesktop />
      <TechChoicesMobile />
    </LandingSection>
  );
}
