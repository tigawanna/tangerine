import { useTheme } from "@/lib/tanstack/router/use-theme";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showDevSelect?: boolean;
}

export function ThemeToggle({ className, showDevSelect = true }: ThemeToggleProps) {
  const { theme, updateTheme } = useTheme();

  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      try {
        document.startViewTransition(() => updateTheme(newTheme));
        return;
      } catch {}
    }
    updateTheme(newTheme);
  }

  return (
    <div data-test="theme-toggle" className="flex items-center gap-2">
      {showDevSelect && import.meta.env.DEV ? (
        <select
          className="select select-bordered select-sm hidden max-w-xs md:inline-flex"
          onChange={(e) => (document.documentElement.dataset.style = e.target.value)}
        >
          <option value="default">Default</option>
          <option value="vertical">Vertical</option>
          <option value="wipe">Wipe</option>
          <option value="angled">Angled</option>
          <option value="flip">Flip</option>
          <option value="slides">Slides</option>
        </select>
      ) : null}
      <button
        type="button"
        onClick={toggleTheme}
        data-test="theme-toggle-button"
        aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        className={cn("btn btn-square size-8 min-h-8 p-0", className)}
      >
        {theme === "light" ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
