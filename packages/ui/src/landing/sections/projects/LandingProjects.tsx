import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { renderProjectCard } from "../../cards/ProjectCard";
import { PortfolioGridSkeleton } from "../../cards/PortfolioGridSkeleton";
import { orderReposByRelevance } from "../../modules/find-relevant-projects";
import { adaptLandingQueryFn, adaptLandingStaleTime, useLandingRuntime } from "../../provider";
import { LandingSection, OrganicDivider, SectionEyebrow } from "../../primitives";
import type { GithubRepoNode } from "../../types/github";
import { filterReposByTopic, matchesProjectSearch } from "./-utils/project-search";
import { ProjectsSearch } from "./ProjectsSearch";
import { ProjectsTopicFilter, type ProjectView } from "./ProjectsTopicFilter";

const MAX_LANDING_PROJECTS = 6;

function filterValidRepos(repos: (GithubRepoNode | null | undefined)[]) {
  return repos.filter((repo): repo is GithubRepoNode => repo != null);
}

function collectTopics(repos: GithubRepoNode[]) {
  const topics = new Set<string>();
  for (const repo of repos) {
    for (const node of repo?.repositoryTopics?.nodes ?? []) {
      if (node.topic.name) {
        topics.add(node.topic.name);
      }
    }
  }
  return Array.from(topics).sort();
}

export function LandingProjectsShell({ children }: { children: ReactNode }) {
  return (
    <LandingSection
      id="projects"
      tone="darkMid"
      className="text-landing-cream"
      dataTest="landing-projects"
    >
      <OrganicDivider tone="darkMid" />
      <OrganicDivider tone="darkMid" flip />

      <div className="container relative z-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <SectionEyebrow>Projects</SectionEyebrow>
          <h2 className="landing-section-heading">Open source projects</h2>
          <p className="landing-section-lead">
            Pinned highlights, recently pushed repos, and topic filters — pulled live from GitHub.
          </p>
        </div>

        {children}
      </div>
    </LandingSection>
  );
}

function ProjectsContent({
  pinnedRepos,
  recentRepos,
}: {
  pinnedRepos: GithubRepoNode[];
  recentRepos: GithubRepoNode[];
}) {
  const [activeView, setActiveView] = useState<ProjectView>("featured");
  const [activeTopic, setActiveTopic] = useState("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const topics = collectTopics(recentRepos);

  const isSearching = appliedSearch.length > 0;

  let visibleRepos: GithubRepoNode[] = [];
  if (isSearching) {
    visibleRepos = orderReposByRelevance(
      filterReposByTopic(recentRepos, activeTopic).filter((repo) =>
        matchesProjectSearch(repo, appliedSearch),
      ),
      appliedSearch,
    );
  } else if (activeView === "featured") {
    visibleRepos = pinnedRepos.slice(0, MAX_LANDING_PROJECTS);
  } else if (activeView === "recent") {
    visibleRepos = recentRepos.slice(0, MAX_LANDING_PROJECTS);
  } else {
    visibleRepos = filterReposByTopic(recentRepos, activeTopic).slice(0, MAX_LANDING_PROJECTS);
  }

  const showEmptySearchState = isSearching && visibleRepos.length === 0;

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <ProjectsTopicFilter
          topics={topics}
          activeTopic={activeTopic}
          activeView={activeView}
          onTopicChange={setActiveTopic}
          onViewChange={setActiveView}
        />
        <ProjectsSearch
          value={searchDraft}
          onChange={setSearchDraft}
          onSubmit={() => setAppliedSearch(searchDraft.trim())}
          onClear={() => {
            setSearchDraft("");
            setAppliedSearch("");
          }}
          hasPendingSearch={searchDraft.trim() !== appliedSearch}
        />
      </div>

      {showEmptySearchState ? (
        <p className="text-center text-sm text-landing-sage/50" data-test="projects-search-empty">
          No projects match your search.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleRepos.map((repo) => renderProjectCard(repo))}
        </div>
      )}
    </div>
  );
}

function readViewerRepoNodes(
  data: unknown,
  collection: "pinnedItems" | "repositories",
): GithubRepoNode[] {
  if (!data || typeof data !== "object") return [];
  if (!("data" in data)) return [];
  const outer = data.data;
  if (!outer || typeof outer !== "object" || !("viewer" in outer)) return [];
  const viewer = outer.viewer;
  if (!viewer || typeof viewer !== "object") return [];
  const bucket = Reflect.get(viewer, collection);
  if (!bucket || typeof bucket !== "object" || !("nodes" in bucket)) return [];
  const nodes = Reflect.get(bucket, "nodes");
  if (!Array.isArray(nodes)) return [];
  return filterValidRepos(nodes);
}

export function LandingProjects() {
  const { pinnedReposQueryOptions, recentReposQueryOptions } = useLandingRuntime();
  const pinnedQuery = useQuery({
    queryKey: pinnedReposQueryOptions.queryKey,
    queryFn: adaptLandingQueryFn(pinnedReposQueryOptions.queryFn),
    staleTime: adaptLandingStaleTime(pinnedReposQueryOptions.staleTime),
  });
  const recentQuery = useQuery({
    queryKey: recentReposQueryOptions.queryKey,
    queryFn: adaptLandingQueryFn(recentReposQueryOptions.queryFn),
    staleTime: adaptLandingStaleTime(recentReposQueryOptions.staleTime),
  });

  const pinnedRepos = readViewerRepoNodes(pinnedQuery.data, "pinnedItems");
  const recentRepos = readViewerRepoNodes(recentQuery.data, "repositories");
  const isLoading = pinnedQuery.isLoading || recentQuery.isLoading;
  const hasRepos = pinnedRepos.length > 0 || recentRepos.length > 0;

  if (isLoading) {
    return (
      <LandingProjectsShell>
        <PortfolioGridSkeleton count={MAX_LANDING_PROJECTS} />
      </LandingProjectsShell>
    );
  }

  if (!hasRepos) {
    return null;
  }

  return (
    <LandingProjectsShell>
      <ProjectsContent pinnedRepos={pinnedRepos} recentRepos={recentRepos} />
    </LandingProjectsShell>
  );
}
