import { cn } from "@/lib/utils";
import {
  useThemeContext,
  type Theme,
} from "@/lib/tanstack/router/theme-provider";
import { withThemeViewTransition } from "@/lib/tanstack/router/theme-view-transition";
import { Monitor, Moon, Sun } from "lucide-react";

const THEME_OPTIONS = [
  {
    id: "light" as const,
    label: "Light",
    description: "Bright surfaces for daytime use",
    icon: Sun,
  },
  {
    id: "dark" as const,
    label: "Dark",
    description: "Dim chrome that stays easy on the eyes",
    icon: Moon,
  },
  {
    id: "system" as const,
    label: "System",
    description: "Follow your OS appearance setting",
    icon: Monitor,
  },
] satisfies Array<{
  id: Theme;
  label: string;
  description: string;
  icon: typeof Sun;
}>;

function ThemePreview({ option }: { option: Theme }) {
  if (option === "system") {
    return (
      <div
        className="grid h-20 grid-cols-2 overflow-hidden rounded-md border border-border"
        aria-hidden
      >
        <div className="bg-[#f4f4f5] p-2.5">
          <div className="mb-1.5 h-1.5 w-8 rounded-full bg-[#a1a1aa]" />
          <div className="h-8 rounded-sm bg-white shadow-sm" />
        </div>
        <div className="bg-[#18181b] p-2.5">
          <div className="mb-1.5 h-1.5 w-8 rounded-full bg-[#52525b]" />
          <div className="h-8 rounded-sm bg-[#27272a]" />
        </div>
      </div>
    );
  }

  if (option === "light") {
    return (
      <div
        className="flex h-20 flex-col gap-2 overflow-hidden rounded-md border border-border bg-[#f4f4f5] p-2.5"
        aria-hidden
      >
        <div className="h-1.5 w-10 rounded-full bg-[#a1a1aa]" />
        <div className="flex flex-1 gap-2">
          <div className="w-1/3 rounded-sm bg-white shadow-sm" />
          <div className="flex-1 rounded-sm bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-20 flex-col gap-2 overflow-hidden rounded-md border border-border bg-[#18181b] p-2.5"
      aria-hidden
    >
      <div className="h-1.5 w-10 rounded-full bg-[#52525b]" />
      <div className="flex flex-1 gap-2">
        <div className="w-1/3 rounded-sm bg-[#27272a]" />
        <div className="flex-1 rounded-sm bg-[#27272a]" />
      </div>
    </div>
  );
}

/**
 * Appearance preference: light, dark, or follow the OS.
 */
export function SettingsThemeSection() {
  const { theme, resolvedTheme, setTheme } = useThemeContext();

  function selectTheme(next: Theme) {
    if (next === theme) return;
    withThemeViewTransition(() => setTheme(next));
  }

  return (
    <section className="flex flex-col gap-4" data-test="settings-theme-section">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Choose how Tangerine looks. System tracks your OS setting
          {theme === "system" ? ` (currently ${resolvedTheme})` : null}.
        </p>
      </header>

      <div
        className="grid gap-3 sm:grid-cols-3"
        role="radiogroup"
        aria-label="Color theme"
      >
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-test={`settings-theme-${option.id}`}
              onClick={() => {
                selectTheme(option.id);
              }}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
                "hover:border-primary/40 hover:bg-muted/40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-background",
              )}
            >
              <ThemePreview option={option.id} />
              <div className="flex items-start gap-2.5">
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium leading-none">{option.label}</span>
                  <span className="text-xs leading-snug text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
