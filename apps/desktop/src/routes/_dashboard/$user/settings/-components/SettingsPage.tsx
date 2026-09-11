import { SettingsModelSection } from "./SettingsModelSection";
import { SettingsThemeSection } from "./SettingsThemeSection";

/**
 * Desktop settings — appearance + local EmbeddingGemma model management.
 */
export function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10" data-test="settings-page">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Local desktop preferences. Auth still runs through the API.
        </p>
      </header>

      <SettingsThemeSection />

      <div className="h-px bg-border" role="separator" />

      <SettingsModelSection />
    </div>
  );
}
