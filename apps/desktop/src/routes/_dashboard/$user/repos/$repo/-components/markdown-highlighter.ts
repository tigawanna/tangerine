import { createHighlighter } from "@tanstack/highlight/core";
import { css } from "@tanstack/highlight/languages/css";
import { dockerfile } from "@tanstack/highlight/languages/dockerfile";
import { html } from "@tanstack/highlight/languages/html";
import { js } from "@tanstack/highlight/languages/js";
import { json } from "@tanstack/highlight/languages/json";
import { jsx } from "@tanstack/highlight/languages/jsx";
import { markdown } from "@tanstack/highlight/languages/markdown";
import { plaintext } from "@tanstack/highlight/languages/plaintext";
import { python } from "@tanstack/highlight/languages/python";
import { shell } from "@tanstack/highlight/languages/shell";
import { sql } from "@tanstack/highlight/languages/sql";
import { toml } from "@tanstack/highlight/languages/toml";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";
import { yaml } from "@tanstack/highlight/languages/yaml";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";
import type { CodeHighlighter } from "@tanstack/markdown";

const highlighter = createHighlighter({
  languages: [
    plaintext,
    html,
    css,
    js,
    jsx,
    ts,
    tsx,
    json,
    yaml,
    toml,
    markdown,
    shell,
    sql,
    python,
    dockerfile,
  ],
});

/** Escaped inner markup for TanStack Markdown code fences. */
export const highlightMarkdownCode: CodeHighlighter =
  createTanStackMarkdownHighlighter(highlighter);
