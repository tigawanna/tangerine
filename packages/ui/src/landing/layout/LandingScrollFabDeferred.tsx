import { lazy, Suspense } from "react";
import { ClientOnly } from "../stubs/client-only";

const LandingScrollFab = lazy(() =>
  import("./LandingScrollFab.js").then((mod) => ({ default: mod.LandingScrollFab })),
);

/**
 * Client-only, code-split entry for the gooey scroll FAB so it never ships in the
 * landing SSR/critical path and only hydrates after mount.
 */
export function LandingScrollFabDeferred() {
  return (
    <ClientOnly>
      <Suspense fallback={null}>
        <LandingScrollFab />
      </Suspense>
    </ClientOnly>
  );
}
