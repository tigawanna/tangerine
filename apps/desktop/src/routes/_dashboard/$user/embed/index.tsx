import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { EmbedPage } from "./-components/EmbedPage";

export const Route = createFileRoute("/_dashboard/$user/embed/")({
  component: EmbedPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Embed · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
