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
  tab: z.enum(enrichedTabs).optional(),
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
