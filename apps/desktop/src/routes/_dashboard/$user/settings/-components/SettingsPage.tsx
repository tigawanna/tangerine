import { SettingsLogsSection } from "@/routes/_dashboard/$user/settings/-components/SettingsLogsSection.tsx";
import { SettingsModelDetailSection } from "@/routes/_dashboard/$user/settings/-components/SettingsModelDetailSection.tsx";
import { SettingsModelNavCard } from "@/routes/_dashboard/$user/settings/-components/SettingsModelNavCard.tsx";
import { SettingsSystemResourcesSection } from "@/routes/_dashboard/$user/settings/-components/SettingsSystemResourcesSection.tsx";
import { SettingsThemeSection } from "@/routes/_dashboard/$user/settings/-components/SettingsThemeSection.tsx";
import {
  settingsRouteID,
  type SettingsSection,
} from "@/routes/_dashboard/$user/settings/-components/constants.ts";
import { getRouteApi } from "@tanstack/react-router";
import { Activity, ChevronRight, ScrollText } from "lucide-react";
import type { ReactNode } from "react";

const routeApi = getRouteApi(settingsRouteID);

type SettingsNavCardProps = {
  title: string;
  description: string;
  icon: typeof Activity;
  section: Exclude<SettingsSection, "model">;
  testId: string;
};

function SettingsNavCard({ title, description, icon: Icon, section, testId }: SettingsNavCardProps) {
  const navigate = routeApi.useNavigate();

  return (
    <button
      type="button"
      data-test={testId}
      className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors"
      onClick={() => {
        void navigate({
          search: (prev) => ({ ...prev, section }),
          replace: true,
        });
      }}
    >
      <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
        <Icon className="text-muted-foreground size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-muted-foreground block text-xs">{description}</span>
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </button>
  );
}

function SettingsHub() {
  return (
    <div className="flex flex-col gap-10" data-test="settings-hub">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Local desktop preferences. Auth still runs through the API.
        </p>
      </header>

      <section className="flex flex-col gap-2" data-test="settings-nav-list">
        <h2 className="text-lg font-semibold tracking-tight">Local</h2>
        <div className="flex flex-col gap-2">
          <SettingsModelNavCard />
          <SettingsNavCard
            testId="settings-nav-system"
            section="system"
            icon={Activity}
            title="System resources"
            description="CPU, memory, and local SQLite queue databases"
          />
          <SettingsNavCard
            testId="settings-nav-logs"
            section="logs"
            icon={ScrollText}
            title="Logs"
            description="Evlog retention and wipe when disk is low"
          />
        </div>
      </section>

      <div className="h-px bg-border" role="separator" />

      <SettingsThemeSection />
    </div>
  );
}

function settingsBody(section: SettingsSection | undefined): ReactNode {
  if (section === "system") return <SettingsSystemResourcesSection />;
  if (section === "logs") return <SettingsLogsSection />;
  if (section === "model") return <SettingsModelDetailSection />;
  return <SettingsHub />;
}

/**
 * Desktop settings — hub list + nested panels via `?section=`.
 */
export function SettingsPage() {
  const search = routeApi.useSearch();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10" data-test="settings-page">
      {settingsBody(search.section)}
    </div>
  );
}
