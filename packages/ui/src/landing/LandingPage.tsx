import type { LessonPreviewItem } from "./types/lessons";
import { LandingFooter } from "./layout/LandingFooter";
import { LandingNavbar } from "./layout/LandingNavbar";
import { LandingScrollFabDeferred } from "./layout/LandingScrollFabDeferred";
import { LandingProvider, type LandingRuntime } from "./provider";
import { LandingHowIWork } from "./sections/about/LandingHowIWork";
import { LandingArticles } from "./sections/articles/LandingArticles";
import { LandingCTA } from "./sections/contact/LandingCTA";
import { LandingFeaturesDeferred } from "./sections/features/LandingFeaturesDeferred";
import { LandingHero } from "./sections/hero/LandingHero";
import { LandingInfodiet } from "./sections/infodiet/LandingInfodiet";
import { LandingLessonsDeferred } from "./sections/lessons/LandingLessonsDeferred";
import { LandingProjectsDeferred } from "./sections/projects/LandingProjectsDeferred";
import { StackCubeDeferred } from "./sections/stack-cube/StackCubeDeferred";

export type LandingPageProps = {
  runtime: LandingRuntime;
  lessonPreviews: LessonPreviewItem[];
};

/**
 * Composed portfolio landing page exported from `@repo/ui/landing`.
 * Host apps supply QueryClient + `LandingRuntime` adapters.
 */
export function LandingPage({ runtime, lessonPreviews }: LandingPageProps) {
  return (
    <LandingProvider value={runtime}>
      <div data-test="landing-page" className="min-h-screen">
        <LandingNavbar />
        <main id="main-content">
          <LandingHero />
          <StackCubeDeferred />
          <LandingHowIWork />
          <LandingFeaturesDeferred />
          <LandingProjectsDeferred />
          <LandingArticles />
          <LandingInfodiet />
          <LandingLessonsDeferred items={lessonPreviews} />
          <LandingCTA />
        </main>
        <LandingFooter />
        <LandingScrollFabDeferred />
      </div>
    </LandingProvider>
  );
}
