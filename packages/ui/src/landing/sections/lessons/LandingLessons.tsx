import { CreatureEggCapitalI, CreatureEggTrigger } from "../../stubs/creature-egg";
import type { LessonPreviewItem } from "../../types/lessons";
import { Link } from "@tanstack/react-router";
import { LessonCard } from "../../cards/LessonCard";
import { LandingSection, OrganicDivider, SectionEyebrow } from "../../primitives";

interface LandingLessonsProps {
  items: LessonPreviewItem[];
}

export function LandingLessons({ items }: LandingLessonsProps) {
  return (
    <LandingSection
      id="journal"
      tone="panel"
      className="text-base-content"
      dataTest="landing-lessons"
    >
      <OrganicDivider tone="panel" />
      <OrganicDivider tone="panel" flip />

      <div className="container relative z-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <SectionEyebrow>
            Today <CreatureEggCapitalI /> learned
          </SectionEyebrow>
          <h2 className="landing-section-heading">
            Cool things <CreatureEggCapitalI /> recently learned
            <CreatureEggTrigger data-test="creature-feature-egg-lessons-period" />
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-base-content/70">
            Small lessons, debugging wins, and notes — stored in Tirso so I can add new ones from
            the admin panel later.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <LessonCard key={item.id} item={item} tone={(index % 3) as 0 | 1 | 2} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/lessons"
            search={{}}
            className="inline-flex items-center justify-center rounded-full border border-primary/30 px-6 py-3 text-sm text-primary transition-colors hover:bg-primary/10"
            data-test="lessons-see-more"
          >
            See more lessons
          </Link>
        </div>
      </div>
    </LandingSection>
  );
}
