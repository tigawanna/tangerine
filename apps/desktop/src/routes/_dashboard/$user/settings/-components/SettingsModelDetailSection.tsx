import { Button } from "@/components/ui/button.tsx";
import { SettingsModelSection } from "@/routes/_dashboard/$user/settings/-components/SettingsModelSection.tsx";
import { settingsRouteID } from "@/routes/_dashboard/$user/settings/-components/constants.ts";
import { getRouteApi } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const routeApi = getRouteApi(settingsRouteID);

/**
 * Full EmbeddingGemma settings panel (download / switch / open paths).
 */
export function SettingsModelDetailSection() {
  const navigate = routeApi.useNavigate();

  return (
    <div className="flex w-full flex-col gap-6" data-test="settings-model-detail">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit px-0"
        data-test="settings-model-back"
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
      <SettingsModelSection />
    </div>
  );
}
