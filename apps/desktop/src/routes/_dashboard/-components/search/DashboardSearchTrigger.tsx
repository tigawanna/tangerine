import { Kbd } from "@/components/ui/kbd";
import {
  GITHUB_SEARCH_INPUT_ID,
  defaultGithubSearch,
  githubSearchViewTransition,
} from "@/routes/_dashboard/-components/search/github-search";
import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

interface DashboardSearchTriggerProps {
  /** Profile login used for `/$user/search`. */
  user: string;
  /** Hide the fake input on the search page so only one VT-named node exists. */
  visible: boolean;
}

/**
 * Header search control. Looks like an input, navigates to the search page
 * with a named view transition. Stays outside the page Suspense boundary.
 */
export function DashboardSearchTrigger({ user, visible }: DashboardSearchTriggerProps) {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const onSearchPage = Boolean(matchRoute({ to: "/$user/search", fuzzy: true }));

  useHotkeys(
    "mod+k",
    (event) => {
      event.preventDefault();
      if (onSearchPage) {
        document.getElementById(GITHUB_SEARCH_INPUT_ID)?.focus();
        return;
      }
      void navigate({
        to: "/$user/search",
        params: { user },
        search: defaultGithubSearch,
        viewTransition: githubSearchViewTransition,
      });
    },
    { enableOnFormTags: true },
  );

  if (!visible) return null;

  return (
    <Link
      to="/$user/search"
      params={{ user }}
      search={defaultGithubSearch}
      viewTransition={githubSearchViewTransition}
      preload="intent"
      aria-label="Search GitHub"
      data-test="dashboard-search-trigger"
      className="github-search-vt border-base-300 bg-base-200/60 text-base-content/50 hover:border-primary/40 hover:text-base-content/70 focus-visible:ring-ring mx-auto flex h-9 w-full max-w-xl items-center gap-2 rounded-lg border px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-left">Search GitHub…</span>
      <Kbd className="bg-base-300 text-base-content/45 hidden sm:inline-flex">⌘K</Kbd>
    </Link>
  );
}
