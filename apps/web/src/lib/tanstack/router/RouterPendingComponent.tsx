import { RouteStatusShell } from "./RouteStatusShell";

/** Single full-route pending entry — use for `pendingComponent` and Suspense fallbacks. */
export function RouterPendingComponent() {
  return (
    <RouteStatusShell
      data-test="router-pending"
      busy
      eyebrow="Loading"
      visual={
        <span
          aria-hidden
          className="border-base-content/15 border-t-primary inline-flex size-12 animate-spin rounded-full border-2"
        />
      }
      title="Just a moment"
      description="Pulling this page together."
    />
  );
}
