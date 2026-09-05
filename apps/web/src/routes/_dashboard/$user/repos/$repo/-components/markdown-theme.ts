import { createThemeCss } from "@tanstack/highlight/theme";
import { githubDarkTheme } from "@tanstack/highlight/themes/github-dark";
import { githubLightTheme } from "@tanstack/highlight/themes/github-light";

/** Highlight token CSS scoped to `.markdown-renderer` (light + `.dark`). */
export const markdownHighlightCss = `${createThemeCss({
  light: githubLightTheme,
  dark: githubDarkTheme,
  lightSelector: ".markdown-renderer",
  darkSelector: ".dark .markdown-renderer",
  codeBlockSelector: ".markdown-renderer pre.tm-code",
  lineNumbersSelector: ".markdown-renderer .tm-code--line-numbers",
})}

.markdown-renderer .th-line--highlighted {
  background: color-mix(in srgb, var(--th-token) 10%, transparent);
}`;
