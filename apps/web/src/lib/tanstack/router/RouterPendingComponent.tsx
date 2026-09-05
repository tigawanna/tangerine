import { AppBrandIcon } from "@/components/icon/AppBrandIcon";
import { RouteStatusShell } from "./RouteStatusShell";

/** Single full-route pending entry — use for `pendingComponent` and Suspense fallbacks. */
export function RouterPendingComponent() {
  return (
    <RouteStatusShell
      data-test="router-pending"
      busy
      eyebrow="Loading"
      visual={<BrandLoadingMark />}
      title="Just a moment"
      description="Pulling this page together."
    />
  );
}

/**
 * Brand gear on a soft amber disc — slow spin reads as mechanical, not a generic spinner.
 */
function BrandLoadingMark() {
  return (
    <div
      aria-hidden
      className="relative flex size-30 items-center justify-center"
    >
      <span className="bg-landing-amber/12 absolute inset-0 rounded-full" />
      <span className="border-landing-amber/30 absolute inset-2 rounded-full border" />
      <span className="border-landing-amber/15 absolute inset-0 rounded-full border border-dashed" />
      <AppBrandIcon size={72} className="landing-brand-spin relative z-10" />
    </div>
  );
}
