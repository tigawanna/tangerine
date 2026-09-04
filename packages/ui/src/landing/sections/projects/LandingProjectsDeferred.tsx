import { ClientOnly } from "../../stubs/client-only";
import { PortfolioGridSkeleton } from "../../cards/PortfolioGridSkeleton";
import { LandingProjects, LandingProjectsShell } from "./LandingProjects";

const MAX_LANDING_PROJECTS = 6;

function LandingProjectsFallback() {
  return (
    <LandingProjectsShell>
      <PortfolioGridSkeleton count={MAX_LANDING_PROJECTS} />
    </LandingProjectsShell>
  );
}

export function LandingProjectsDeferred() {
  return (
    <ClientOnly fallback={<LandingProjectsFallback />}>
      <LandingProjects />
    </ClientOnly>
  );
}
