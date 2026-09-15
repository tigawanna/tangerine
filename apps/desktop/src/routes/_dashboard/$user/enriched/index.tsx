import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { EnrichedPage } from "@/routes/_dashboard/$user/enriched/-components/EmbedPage.tsx";



export const Route = createFileRoute("/_dashboard/$user/enriched/")({
  component: EnrichedPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Enriched · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
