import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { EnrichedPage } from "@/routes/_dashboard/$user/enriched/-components/EnrichedPage.tsx";
import z from "zod";
import { enrichedTabs } from "@/routes/_dashboard/$user/enriched/-components/constants.ts";

const searchParms = z.object({
  search: z.string().optional(),
  tab: z.enum(enrichedTabs).default("console"),
});

export const Route = createFileRoute("/_dashboard/$user/enriched/")({
  validateSearch: searchParms,
  component: EnrichedPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Enriched · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
