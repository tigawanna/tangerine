# Backstage List Pattern

How to build searchable, paginated backstage lists using the shared utilities — modeled on `BackstageJournalList`.

Apply this when adding or cleaning up any backstage index list (journal, messages, projects, GitHub repos, etc.). Same fundamentals whether data comes from React Query or TanStack DB.

---

## Shared utilities

| Utility                       | Path                                          | Role                                                                            |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| `usePageSearchQuery(routeID)` | `components/search/use-page-search-query.ts`  | Local input + debounced URL `q`; resets `page` on commit; exposes `clearSearch` |
| `SearchBox`                   | `components/search/SearchBox.tsx`             | Controlled search input; shows spinner while `isDebouncing`                     |
| `TSRListPagination`           | `components/pagination/TSRListPagination.tsx` | Reads `page` from the route search, navigates while preserving other params     |

Always pass the **file route id** (e.g. `"/_backstage/backstage/journal"`), not the path (`"/backstage/journal"`).

```tsx
const { inputValue, onSearchChange, isDebouncing, clearSearch } = usePageSearchQuery(
  "/_backstage/backstage/journal",
);

<SearchBox
  keyword={inputValue}
  setKeyword={(value) => onSearchChange(value)}
  isDebouncing={isDebouncing}
/>

<TSRListPagination routeID="/_backstage/backstage/journal" totalPages={totalPages} />
```

### Search param contract

- URL param is always **`q`** (not `sq` / `search`).
- Route `validateSearch` must include `q: z.string().optional()` and `page: z.coerce.number().int().min(1).optional()`.
- Debounced commit clears `page` so results start at page 1.
- Default debounce is **400ms**.
- `clearSearch()` clears `q` + `page` immediately (no debounce) — use it on search-empty CTAs.
- Filter / sort patches use `Route.useNavigate()` (or a small local `patchSearch`) — not the search hook.

### Pagination contract

- `TSRListPagination` merges into existing search (sort, filters, `q`) and omits `page` when `page <= 1`.
- Returns `null` when `totalPages <= 1`.
- Do **not** hand-roll `useTransition` + `navigate` page setters beside it.

---

## Anatomy: list + scaffold

Split every list into two pieces:

1. **List** — data, early-return states, row rendering.
2. **Scaffold** — chrome that stays mounted across states: title, search, primary action / filters dialog, children slot, pagination.

```
┌─────────────────────────────────────────┐
│ Scaffold                                │
│  title + description                     │
│  [SearchBox]  [FiltersDialog?] [CTA?]   │
│  ┌───────────────────────────────────┐  │
│  │ children (pending / empty / list) │  │
│  └───────────────────────────────────┘  │
│  TSRListPagination                      │
└─────────────────────────────────────────┘
```

### Why wrap every branch in the scaffold

Pending, empty, search-empty, and loaded rows all share the same header/search/pagination. Nesting each early return inside the scaffold avoids duplicating chrome and keeps dialogs (create, filters, bulk import) mounted so their open state is not torn down on refetch.

```tsx
function BackstageThingList() {
  const search = Route.useSearch();
  const q = search.q ?? "";
  // fetch…

  if (isPending) {
    return (
      <ThingListScaffold>
        <BackstagePending />
      </ThingListScaffold>
    );
  }

  if (items.length === 0) {
    return (
      <ThingListScaffold totalPages={0}>
        {hasSearch ? <ThingSearchEmpty query={q.trim()} /> : <ThingEmpty />}
      </ThingListScaffold>
    );
  }

  return (
    <ThingListScaffold totalPages={pagination.totalPages}>
      <ul>{items.map(/* … */)}</ul>
    </ThingListScaffold>
  );
}
```

### Scaffold owns search + dialogs

```tsx
function ThingListScaffold({ children, totalPages = 0 }) {
  const { inputValue, onSearchChange, isDebouncing } = usePageSearchQuery(ROUTE_ID);

  return (
    <div className="flex min-h-full w-full max-w-5xl flex-col gap-6">
      {/* title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchBox
            keyword={inputValue}
            setKeyword={(value) => onSearchChange(value)}
            isDebouncing={isDebouncing}
          />
        </div>
        {/* Filters dialog and/or create/import dialogs live here */}
      </div>
      {children}
      <TSRListPagination routeID={ROUTE_ID} totalPages={totalPages} />
    </div>
  );
}
```

Row-level edit/delete dialogs stay on the row component (nested dialogs are fine). List-level actions (create, bulk import, filters) belong in the scaffold.

---

## Early returns over nested ternaries

Prefer:

```tsx
if (isPending)
  return (
    <Scaffold>
      <Pending />
    </Scaffold>
  );
if (items.length === 0) {
  return <Scaffold>{hasSearch ? <SearchEmpty /> : <Empty />}</Scaffold>;
}
return (
  <Scaffold>
    <List />
  </Scaffold>
);
```

Avoid:

```tsx
{
  isPending ? <Pending /> : items.length === 0 ? hasSearch ? <SearchEmpty /> : <Empty /> : <List />;
}
```

Extract tiny presentational empties (`ThingSearchEmpty`, `ThingEmpty`) instead of inlining long JSX in conditionals.

---

## Data sources

### React Query (server-paginated)

Journal / messages style:

```tsx
const { data, isPending } = useQuery(
  thingsQueryOptions({ page, perPage: BACKSTAGE_LIST_PER_PAGE, q }),
);
const items = data?.items ?? [];
const totalPages = data?.pagination.totalPages ?? 0;
```

- Prefer `useQuery` + pending early return when the list can show a pending shell inside the scaffold.
- `useSuspenseQuery` is fine when the route already has a `pendingComponent` and you only need empty vs loaded.

### TanStack DB (client-filtered / client-paginated)

Projects / GitHub style:

```tsx
const q = search.q ?? ""; // committed URL value — feed the live query
const { data: rows } = useLiveSuspenseQuery(/* where ilike … q … */, [q, sortBy, …]);
const { items, pagination } = paginateItems(rows, page, BACKSTAGE_LIST_PER_PAGE);
```

- Drive the live query from the **committed** URL `q` (`search.q`), not the local input value. Local typing is for the `SearchBox` only; debounce happens in `usePageSearchQuery`.
- Keep `BackstageFiltersDialog` + `TanstackDBSortSelect` in the scaffold; patch non-`q` params with `navigate({ search: (prev) => ({ …prev, … }) })` or a small helper.
- Empty state: `rows.length === 0` (not just the current page slice).

---

## Reducing useEffect noise

| Smell                                         | Prefer                                            |
| --------------------------------------------- | ------------------------------------------------- |
| Syncing input ↔ URL by hand                   | `usePageSearchQuery`                              |
| Page `navigate` + `useTransition`             | `TSRListPagination`                               |
| Multiple effects for the same async lifecycle | One effect, or fold into the existing domain hook |
| Effects that only derive render flags         | Compute during render / early returns             |

Do not reintroduce `useTSRSearchQuery` for new backstage lists — it is the older per-route hook; `usePageSearchQuery` is the shared replacement (`q` only).

---

## Route checklist

1. `validateSearch`: `page`, `q`, plus any sort/filter enums.
2. `beforeLoad`: admin gate (existing pattern).
3. Route file stays thin: export `Route`, render the list component (lazy + `ClientOnly` only when TanStack DB / browser APIs require it).
4. List lives under `routes/_backstage/backstage/-components/<domain>/`.
5. `data-test` on the list root, search empty, and primary actions.
6. Empty UI uses the shared `Empty` primitives (`components/ui/empty`), not one-off cards, unless the surface is truly interactive.

---

## Reference implementation

Canonical source of truth:

- `apps/web/src/routes/_backstage/backstage/-components/journal/BackstageJournalList.tsx`
- Route: `apps/web/src/routes/_backstage/backstage/journal.tsx`

Follow that shape for messages, projects, and GitHub repos.
