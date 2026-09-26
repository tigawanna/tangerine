import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { EnrichedPage } from "@/routes/_dashboard/$user/enriched/-components/EnrichedPage.tsx";
import { z } from "zod";
import { enrichedTabs } from "@/routes/_dashboard/$user/enriched/-components/constants.ts";

/**
 * Flat optional search — no Zod `.default()` (avoids validateSearch URL rewrite loops).
 * Apply tab default in the page component.
 */
const enrichedSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  // Drop legacy `console` tab (moved to Settings → System resources).
  tab: z
    .string()
    .optional()
    .transform((value): (typeof enrichedTabs)[number] | undefined => {
      if (value === "starred" || value === "repos") return value;
      return undefined;
    }),
});

export type EnrichedSearch = z.infer<typeof enrichedSearchSchema>;

export const Route = createFileRoute("/_dashboard/$user/enriched/")({
  validateSearch: (search) => enrichedSearchSchema.parse(search),
  component: EnrichedPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Enriched · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
