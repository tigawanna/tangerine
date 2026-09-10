import { SettingsModelSection } from "./SettingsModelSection";

/**
 * Desktop settings — local EmbeddingGemma model management first.
 */
export function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8" data-test="settings-page">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Local desktop preferences. Auth still runs through the API.
        </p>
      </header>

      <SettingsModelSection />
    </div>
  );
}
