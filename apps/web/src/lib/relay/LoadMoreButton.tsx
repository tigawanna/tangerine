import type { usePaginationFragmentHookType } from "react-relay/relay-hooks/usePaginationFragment";

interface LoadMoreButtonProps<
  K extends Readonly<{ " $data"?: unknown; " $fragmentSpreads": unknown }>,
  D,
> {
  frag: usePaginationFragmentHookType<any, K, D | null | undefined>;
}

/**
 * Load-next control for Relay `@refetchable` pagination fragments.
 */
export function LoadMoreButton<
  K extends Readonly<{ " $data"?: unknown; " $fragmentSpreads": unknown }>,
  D,
>({ frag }: LoadMoreButtonProps<K, D>) {
  if (!frag?.hasNext) return null;

  return (
    <div className="flex w-full items-center justify-center py-4">
      <button
        type="button"
        className="border-base-300 bg-base-200/40 text-base-content/70 hover:bg-base-200 hover:text-base-content rounded-lg border px-4 py-2 text-sm transition-colors disabled:opacity-50"
        disabled={frag.isLoadingNext}
        onClick={() => {
          frag.loadNext(12);
        }}
        data-test="relay-load-more"
      >
        {frag.isLoadingNext ? "Loading…" : "Load more"}
      </button>
    </div>
  );
}
