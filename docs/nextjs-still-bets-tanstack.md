## 2. Suspense-Aware Routing (and the Query-Param Flicker)

Next's data fetching and router integrate more cleanly with Suspense. TanStack Router leans on an external store for a lot of its state, and that store doesn't register with Suspense the way you'd hope.

A common pain point: a list driven by search params (filters, page, sort). Change a param, TanStack tracks it, your `useSuspenseQuery` re-suspends, and the Suspense boundary flickers.

![useSuspenseQuery](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/6ynj01excbygyxcw1a5s.gif)

In Next.js you'd wrap the update in `useTransition` so React keeps showing the old UI until the new data is ready. Same trick on TanStack Router / Start? Mostly a no-op: the navigate still lands, the query still suspends, and you still get the fallback flash.

![Nextjs suspense transitions](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/swsal6m7pkyvzqg68lgs.gif)

**Workarounds (neither ideal):**

1. Swap `useSuspenseQuery` for `useQuery` + `keepPreviousData` so you never hit a Suspense boundary on param changes. Old rows stay on screen; dim them with `isFetching` / `isPlaceholderData`.
2. If you're on a fully suspenseful library (e.g. Relay), you're mostly stuck. Compose so controls (search, pagination) live _outside_ the suspending region and only the data pane suspends. Filters stay mounted, but you still get flicker in the list where `startTransition` would have held previous data.

![useQuery + keep previous data](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/4agnov1a3chkvmn6hfwq.gif)

Same patterns as the demos above, side by side:

```tsx
// Pain: useSuspenseQuery + startTransition (no-op dampening)
function ProductsPage() {
  const { page, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [isPending, startTransition] = useTransition();

  // Looks like the Next pattern. Does not hold previous UI here.
  // Router search updates aren't coordinated with Suspense the way
  // React state + use() are.
  function goToPage(nextPage: number) {
    startTransition(() => {
      navigate({ search: (prev) => ({ ...prev, page: nextPage }) });
    });
  }

  return (
    <>
      <Filters onPageChange={goToPage} />
      <div className={isPending ? "opacity-60" : ""}>
        <Suspense fallback={<ListSkeleton />}>
          <ProductResults page={page} q={q} />
        </Suspense>
      </div>
    </>
  );
}

function ProductResults({ page, q }: { page: number; q: string }) {
  // Changing page / q re-suspends → fallback flash
  // (even when navigate was wrapped in startTransition)
  const { data } = useSuspenseQuery(productsQueryOptions({ page, q }));
  return <ProductList products={data} />;
}

// Workaround: useQuery + keepPreviousData (no Suspense flicker)
function ProductsPageKeepPrevious() {
  const { page, q } = Route.useSearch();
  const { data, isFetching, isPlaceholderData } = useQuery({
    ...productsQueryOptions({ page, q }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Filters />
      {/* dim via isFetching / isPlaceholderData */}
      <ProductList products={data} />
    </>
  );
}

// Next contrast: startTransition *does* hold the previous list
const [isPending, startTransition] = useTransition();

function selectColor(next: string) {
  startTransition(() => setColor(next)); // keeps old UI while Results suspends
}
```
