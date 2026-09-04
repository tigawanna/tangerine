# `@repo/ui/landing`

Shared portfolio landing UI. Host apps provide:

1. A TanStack **QueryClient** (already in the app tree — no provider in this package)
2. A `LandingRuntime` via `LandingProvider` (query options + contact sender)

## Usage

```tsx
import {
  LandingProvider,
  LandingNavbar,
  LandingHero,
  // …same section exports as the old local landing folder
  type LandingRuntime,
} from "@repo/ui/landing";

const runtime = {
  pinnedReposQueryOptions,
  recentReposQueryOptions,
  sendContactMessage: async (values) => sendContactMessage({ data: values }),
} satisfies LandingRuntime;

<LandingProvider value={runtime}>{/* compose sections */}</LandingProvider>;
```

Or use the composed page:

```tsx
import { LandingPage } from "@repo/ui/landing";

<LandingPage runtime={runtime} lessonPreviews={lessonPreviews} />;
```

## E2E

Do **not** put Playwright here. Couple e2e to the host app
(`apps/portfolio/e2e/landing`) and point it at `/` or `/gg`.
