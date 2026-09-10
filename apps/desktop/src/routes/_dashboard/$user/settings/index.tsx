import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "./-components/SettingsPage";

export const Route = createFileRoute("/_dashboard/$user/settings/")({
  component: SettingsPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Settings · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
