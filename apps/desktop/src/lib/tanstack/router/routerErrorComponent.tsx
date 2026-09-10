import { Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { RouteStatusShell } from "./RouteStatusShell";

interface RouterErrorComponentProps {
  error: Error;
  reset?: () => void;
}

/**
 * Builds a clipboard-ready dump of the error name, message, and stack.
 */
function formatErrorForClipboard(error: Error): string {
  const lines = [`${error.name}: ${error.message}`];
  if (error.stack) {
    lines.push("", error.stack);
  }
  return lines.join("\n");
}

export function RouterErrorComponent({ error, reset }: RouterErrorComponentProps) {
  return (
    <RouteStatusShell
      data-test="router-error"
      title={<>Something failed</>}
      description="This page hit a snag on our end. Give it another moment, or head back home while we sort things out."
      actions={
        <>
          <Link to="/" data-test="router-error-home" className="landing-cta-primary">
            Back home
          </Link>
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
        </>
      }
      footer={import.meta.env.DEV ? <RouterErrorDevelopmentPanel error={error} /> : null}
    />
  );
}

function RouterErrorDevelopmentPanel({ error }: { error: Error }) {
  const [copied, setCopied] = useState(false);

  async function copyErrorDetails() {
    try {
      await navigator.clipboard.writeText(formatErrorForClipboard(error));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      data-test="router-error-development"
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

      <div className="mt-2 min-w-0 overflow-x-auto">
        <p className="text-landing-fg-muted w-max max-w-none font-mono text-sm leading-6 whitespace-pre">
          {error.message}
        </p>
      </div>

      {error.stack ? (
        <details className="group mt-4" open>
          <summary className="text-landing-fg-muted hover:text-landing-fg cursor-pointer text-sm transition-colors">
            Stack trace
          </summary>
          <pre className="border-landing-border bg-landing-surface/80 text-landing-fg-muted mt-3 max-h-64 min-w-0 overflow-auto rounded-xl border p-3 font-mono text-xs leading-5 whitespace-pre">
            {error.stack}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
