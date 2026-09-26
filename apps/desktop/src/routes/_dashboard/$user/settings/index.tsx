import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "./-components/SettingsPage";
import { settingsSections } from "./-components/constants";
import { z } from "zod";

/**
 * Flat optional search — no Zod `.default()` (avoids validateSearch URL rewrite loops).
 */
const settingsSearchSchema = z.object({
  section: z.enum(settingsSections).optional(),
});

export type SettingsSearch = z.infer<typeof settingsSearchSchema>;

export const Route = createFileRoute("/_dashboard/$user/settings/")({
  validateSearch: (search) => settingsSearchSchema.parse(search),
  component: SettingsPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Settings · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
