import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { highlightMarkdownCode } from "./markdown-highlighter";
import { markdownHighlightCss } from "./markdown-theme";

const markdownComponents = {
  a(props) {
    const external = props.href?.startsWith("http") ?? false;
    return (
      <a
        {...props}
        className="text-primary underline-offset-2 hover:underline"
        rel={external ? "nofollow noopener noreferrer" : props.rel}
        target={external ? "_blank" : props.target}
      />
    );
  },
  img(props) {
    return (
      <img
        {...props}
        className="border-base-300 my-4 max-w-full rounded-lg border"
        loading="lazy"
      />
    );
  },
} satisfies MarkdownComponents;

type RepoReadmeProps = {
  source: string;
  path?: string | null;
};

/**
 * Renders a repository README with TanStack Markdown + Highlight.
 */
export function RepoReadme({ source, path }: RepoReadmeProps) {
  return (
    <section
      className="border-base-300 bg-base-200/30 space-y-4 rounded-xl border p-6 md:p-8"
      data-test="repo-detail-readme"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">README</h2>
        {path ? <p className="text-base-content/45 font-mono text-xs">{path}</p> : null}
      </div>

      <article
        className="markdown-renderer text-base-content/85 [&_blockquote]:border-base-300 [&_blockquote]:text-base-content/60 [&_code]:bg-base-200 [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1:first-child]:mt-0 [&_h2]:mt-7 [&_h2]:mb-2.5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:border-base-300 [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_p]:leading-7 [&_pre.tm-code]:bg-base-300/60 [&_pre.tm-code]:my-4 [&_pre.tm-code]:overflow-x-auto [&_pre.tm-code]:rounded-lg [&_pre.tm-code]:p-4 [&_pre.tm-code]:text-sm [&_pre.tm-code_code]:bg-transparent [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border-base-300 [&_td]:border [&_td]:px-3 [&_td]:py-1.5 [&_th]:border-base-300 [&_th]:border [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em]"
      >
        <style>{markdownHighlightCss}</style>
        <Markdown highlighter={highlightMarkdownCode} codeLineNumbers components={markdownComponents}>
          {source}
        </Markdown>
      </article>
    </section>
  );
}
