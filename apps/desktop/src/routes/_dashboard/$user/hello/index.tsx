import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { HelloPage } from "@/routes/_dashboard/$user/hello/-components/HeloPage.tsx";




export const Route = createFileRoute("/_dashboard/$user/hello/")({
  component: HelloPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Hello · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
