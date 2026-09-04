import { howIWorkSections } from "../../config/info";
import type { CurvedSection } from "../../types/curved-sections";
import { CurvedNumberedSections } from "./CurvedNumberedSections";

const howIWorkCurvedSections = howIWorkSections.map(
  (section): CurvedSection => ({
    id: section.id,
    label: section.title,
    body: section.body,
    eyebrow: section.tag,
    background: section.background,
    foreground: section.foreground,
  }),
);

export function LandingHowIWork() {
  return (
    <section id="about" data-test="landing-how-i-work" aria-labelledby="how-i-work-heading">
      <h2 id="how-i-work-heading" className="sr-only">
        How I work
      </h2>
      <CurvedNumberedSections sections={howIWorkCurvedSections} />
    </section>
  );
}
