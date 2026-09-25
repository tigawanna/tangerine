import { TRouteID } from "@/lib/tanstack/router/router-types";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const SEARCH_DEBOUNCE_MS = 400;

type UsePageSearchQueryOptions = {
  /** Debounce wait before committing `q` to the URL (ms). */
  wait?: number;
};

/**
 * Debounced URL `q` search for a TanStack Router route id.
 *
 * Keeps a local input value in sync with the committed `q` search param and
 * resets `page` whenever the query commits or clears.
 *
 * Own navigations never overwrite in-progress typing (compares against the last
 * value we committed, so React Strict Mode double-effects can't clobber keys).
 *
 * @param routeID - File route id (e.g. `"/_backstage/backstage/journal"`).
 */
export function usePageSearchQuery(routeID: TRouteID, options?: UsePageSearchQueryOptions) {
  const routeApi = getRouteApi(routeID);
  const routeSearch = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const searchQuery = "q" in routeSearch ? (routeSearch.q ?? "") : "";
  const [inputValue, setInputValue] = useState(searchQuery);
  /** Last `q` we wrote via navigate — used to ignore echo from our own commits. */
  const lastCommittedRef = useRef(searchQuery);
  const wait = options?.wait ?? SEARCH_DEBOUNCE_MS;

  useEffect(() => {
    // External URL change (back/forward, link) — not an echo of our own commit.
    if (searchQuery === lastCommittedRef.current) return;
    lastCommittedRef.current = searchQuery;
    setInputValue(searchQuery);
  }, [searchQuery]);

  const commitSearch = useDebouncedCallback(
    (value: string) => {
      const trimmed = value.trim();
      const nextQ = trimmed.length > 0 ? trimmed : undefined;
      const nextCommitted = nextQ ?? "";
      if (nextCommitted === lastCommittedRef.current) return;

      lastCommittedRef.current = nextCommitted;
      void navigate({
        search: (prev) => ({
          ...prev,
          q: nextQ,
          page: undefined,
        }),
        replace: true,
      });
    },
    { wait },
  );

  function onSearchChange(value: string) {
    setInputValue(value);
    // Empty clear should hit the URL immediately (X button / select-all delete).
    if (value.length === 0) {
      if (lastCommittedRef.current === "") return;
      lastCommittedRef.current = "";
      void navigate({
        search: (prev) => ({
          ...prev,
          q: undefined,
          page: undefined,
        }),
        replace: true,
      });
      return;
    }
    commitSearch(value);
  }

  /**
   * Clears the search input and URL `q` immediately (no debounce).
   */
  function clearSearch() {
    setInputValue("");
    if (lastCommittedRef.current === "") return;
    lastCommittedRef.current = "";
    void navigate({
      search: (prev) => ({
        ...prev,
        q: undefined,
        page: undefined,
      }),
      replace: true,
    });
  }

  const isDebouncing = inputValue.trim() !== searchQuery;

  return { inputValue, onSearchChange, clearSearch, isDebouncing };
}
