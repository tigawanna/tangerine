import { Button } from "@/components/ui/button.tsx";
import { ProcessMetricsPanel } from "@/routes/_dashboard/$user/settings/-components/ProcessMetricsPanel.tsx";
import { SqliteDatabasesSection } from "@/routes/_dashboard/$user/settings/-components/SqliteDatabasesSection.tsx";
import { settingsRouteID } from "@/routes/_dashboard/$user/settings/-components/constants.ts";
import { getRouteApi } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const routeApi = getRouteApi(settingsRouteID);

/**
 * Full system-resources view: live process metrics + SQLite queue files.
 */
export function SettingsSystemResourcesSection() {
  const navigate = routeApi.useNavigate();

  return (
    <div className="flex w-full flex-col gap-8" data-test="settings-system-resources">
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit px-0"
          data-test="settings-system-back"
          onClick={() => {
            void navigate({
              search: (prev) => ({ ...prev, section: undefined }),
              replace: true,
            });
          }}
        >
          <ArrowLeft className="size-4" />
          Settings
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">System resources</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Live load for this app process, plus local Conveyor SQLite databases you can delete to
            reclaim disk.
          </p>
        </div>
      </div>

      <ProcessMetricsPanel />

      <div className="h-px bg-border" role="separator" />

      <SqliteDatabasesSection />
    </div>
  );
}
