import type { LessonPreviewItem } from "../../types/lessons";
import { ClientOnly } from "../../stubs/client-only";
import { LessonCard } from "../../cards/LessonCard";
import { LandingSection, OrganicDivider, SectionEyebrow } from "../../primitives";
import { LandingLessons } from "./LandingLessons";

interface LandingLessonsDeferredProps {
  items: LessonPreviewItem[];
}

function LandingLessonsFallback({ items }: LandingLessonsDeferredProps) {
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
          <SectionEyebrow>Today I learned</SectionEyebrow>
          <h2 className="landing-section-heading">Cool things I recently learned</h2>
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
      </div>
    </LandingSection>
  );
}

export function LandingLessonsDeferred({ items }: LandingLessonsDeferredProps) {
  return (
    <ClientOnly fallback={<LandingLessonsFallback items={items} />}>
      <LandingLessons items={items} />
    </ClientOnly>
  );
}
