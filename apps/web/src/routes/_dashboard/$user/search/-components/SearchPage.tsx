import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  GITHUB_SEARCH_INPUT_ID,
  githubSearchTypes,
  hasUserScope,
  resolveGithubSearch,
  toggleUserScope,
  type GithubSearchType,
} from "@/routes/_dashboard/-components/search/github-search";
import { GithubSearchFiltersDialog } from "./GithubSearchFiltersDialog";
import { SearchList, SearchResultsFallback } from "./SearchList";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { getRouteApi } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

const searchRoute = getRouteApi("/_dashboard/$user/search/");

/**
 * Search chrome lives above Suspense. Navigations already run in startTransition,
 * which does not stop Relay from suspending — the input must not be inside the
 * boundary that `usePreloadedQuery` trips.
 */
export function SearchPage() {
  const { inputValue, onInputChange, isDebouncing, committed, type, setType, patchQuery } =
    useGithubSearchQuery();
  const { user } = searchRoute.useParams();
  const queryRef = searchRoute.useLoaderData();
  const scoped = hasUserScope(inputValue, user);
  const hasQuery = committed.trim().length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" data-test="github-search-page">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="github-search-vt h-11 min-w-0 flex-1 rounded-xl">
            <InputGroupAddon align="inline-start">
              <Search className="size-4" aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id={GITHUB_SEARCH_INPUT_ID}
              value={inputValue}
              placeholder="Search repositories and users…"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              data-test="github-search-input"
              onChange={(event) => {
                onInputChange(event.target.value);
              }}
            />
            <InputGroupAddon align="inline-end" className="gap-1">
              {isDebouncing ? <Spinner className="text-base-content/45" /> : null}
              {inputValue ? (
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear search"
                  data-test="github-search-clear"
                  onClick={() => {
                    patchQuery("");
                  }}
                >
                  <X />
                </InputGroupButton>
              ) : null}
            </InputGroupAddon>
          </InputGroup>

          <Select
            value={type}
            onValueChange={(value) => {
              if (value === "REPOSITORY" || value === "USER") {
                setType(value);
              }
            }}
          >
            <SelectTrigger className="h-11 w-full sm:w-44" data-test="github-search-type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {githubSearchTypes.map((item) => (
                <SelectItem key={item} value={item}>
                  {item === "USER" ? "Users" : "Repositories"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant={scoped ? "default" : "outline"}
            data-test="github-search-user-scope"
            onClick={() => {
              patchQuery(toggleUserScope(inputValue, user));
            }}
          >
            @{user}
          </Button>
          <GithubSearchFiltersDialog
            query={inputValue}
            profileLogin={user}
            searchType={type}
            onApply={patchQuery}
          />
          <p className="text-base-content/45 text-xs">
            Limit to this profile, or compose GitHub search syntax.
          </p>
        </div>
      </div>

      {hasQuery && queryRef ? (
        <Suspense fallback={<SearchResultsFallback searchType={type} />} key={`${type}:${committed}`}>
          <SearchList queryRef={queryRef} />
        </Suspense>
      ) : (
        <Empty className="border-base-300 min-h-72 border border-dashed" data-test="github-search-prompt">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>Search GitHub</EmptyTitle>
            <EmptyDescription>
              Type a query, then wait a moment — results load below without replacing this input.
              Press <Kbd>⌘K</Kbd> anytime to focus search.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}

function useGithubSearchQuery() {
  const search = resolveGithubSearch(searchRoute.useSearch());
  const navigate = searchRoute.useNavigate();
  const committed = search.q;
  const type = search.type;
  const [inputValue, setInputValue] = useState(committed);
  const [debouncedValue] = useDebouncedValue(inputValue, { wait: 400 });
  const isDebouncing = inputValue !== debouncedValue;

  useEffect(() => {
    setInputValue(committed);
  }, [committed]);

  useEffect(() => {
    // Wait until debounce has caught up to the live input. Instant patches
    // (scope chip / clear) update input + URL together; without this guard the
    // stale empty debounce value would navigate and wipe `q` a tick later.
    if (debouncedValue !== inputValue) return;
    if (debouncedValue === committed) return;
    void navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        q: debouncedValue || undefined,
      }),
      replace: true,
    });
  }, [committed, debouncedValue, inputValue, navigate]);

  function patchQuery(next: string) {
    setInputValue(next);
    void navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        q: next || undefined,
      }),
      replace: true,
    });
  }

  function setType(next: GithubSearchType) {
    void navigate({
      to: ".",
      search: (prev) => ({
        ...prev,
        type: next === "REPOSITORY" ? undefined : next,
      }),
      replace: true,
    });
  }

  return {
    inputValue,
    onInputChange: setInputValue,
    isDebouncing,
    committed,
    type,
    setType,
    patchQuery,
  };
}
