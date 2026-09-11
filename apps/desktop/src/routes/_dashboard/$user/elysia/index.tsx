import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { ElysiaLabPage } from "./-components/ElysiaLabPage";

export const Route = createFileRoute("/_dashboard/$user/elysia/")({
  component: ElysiaLabPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Elysia lab · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
