import { Link } from "@tanstack/react-router";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { RouteStatusShell } from "./RouteStatusShell";

interface RouterErrorComponentProps {
  error: Error;
  reset?: () => void;
}

/**
 * Walks `error.cause` and formats name / message / stack for display + clipboard.
 */
function formatErrorDump(error: unknown): string {
  const blocks: string[] = [];
  let current: unknown = error;
  let depth = 0;

  while (current != null && depth < 8) {
    if (current instanceof Error) {
      blocks.push(
        [
          depth === 0 ? `${current.name}: ${current.message}` : `Caused by: ${current.name}: ${current.message}`,
          current.stack ?? "(no stack)",
        ].join("\n"),
      );
      current = current.cause;
      depth += 1;
      continue;
    }

    try {
      blocks.push(JSON.stringify(current, null, 2));
    } catch {
      // oxlint-disable-next-line typescript/no-base-to-string
      blocks.push(String(current));
    }
    break;
  }

  return blocks.join("\n\n");
}

export function RouterErrorComponent({ error, reset }: RouterErrorComponentProps) {
  function reloadPage() {
    window.location.reload();
  }

  return (
    <RouteStatusShell
      data-test="router-error"
      title={<>Something failed</>}
      description="This page hit a snag on our end. Give it another moment, reload, or head back home while we sort things out."
      actions={
        <>
          <button
            type="button"
            data-test="router-error-reload"
            onClick={reloadPage}
            className="landing-cta-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Reload
          </button>
          {reset ? (
            <button
              type="button"
              data-test="router-error-retry"
              onClick={reset}
              className="landing-cta-secondary"
            >
              Try again
            </button>
          ) : null}
          <Link to="/" data-test="router-error-home" className="landing-cta-secondary">
            Back home
          </Link>
        </>
      }
      footer={<RouterErrorDetailsPanel error={error} />}
    />
  );
}

function RouterErrorDetailsPanel({ error }: { error: Error }) {
  const [copied, setCopied] = useState(false);
  const dump = formatErrorDump(error);

  async function copyErrorDetails() {
    try {
      await navigator.clipboard.writeText(dump);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      data-test="router-error-details"
      className="border-landing-border bg-landing-panel/90 w-full min-w-0 overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-landing-ember font-mono text-sm">{error.name}</p>
        <button
          type="button"
          data-test="router-error-copy"
          onClick={() => void copyErrorDetails()}
          className="border-landing-border text-landing-fg-muted hover:border-landing-amber/40 hover:text-landing-fg inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors"
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre
        data-test="router-error-dump"
        className="border-landing-border bg-landing-surface/80 text-landing-fg-muted mt-3 max-h-[min(28rem,50vh)] min-w-0 overflow-auto rounded-xl border p-3 font-mono text-xs leading-5 whitespace-pre-wrap wrap-break-word"
      >
        {dump}
      </pre>
    </div>
  );
}
