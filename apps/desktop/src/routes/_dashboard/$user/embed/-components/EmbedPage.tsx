import { EMBED_TEXT_MAX_CHARS, EMBED_TEXT_MAX_WORDS } from "@/data-access-layer/embeddings/embed-limits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmbedTextResult, GemmaLoadStatusResult } from "@/server/elysia/routes/models/embedding-types.ts";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { getRouteApi } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

const embedRoute = getRouteApi("/_dashboard/$user/embed/");

const PREVIEW_DIMS = 12;

/** Counts whitespace-separated tokens; empty / whitespace-only → 0. */
function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Playground: paste text → local Gemma embedding. No DB write.
 */
export function EmbedPage() {
  const { user } = embedRoute.useParams();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"document" | "query">("document");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EmbedTextResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [loadStatus, setLoadStatus] = useState<GemmaLoadStatusResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startMsRef = useRef(0);

  const charCount = text.length;
  const wordCount = countWords(text);
  const tooLong = charCount > EMBED_TEXT_MAX_CHARS;
  const tooManyWords = wordCount > EMBED_TEXT_MAX_WORDS;
  const canSubmit = Boolean(text.trim()) && !tooLong && !pending;
  const downloading = Boolean(pending && loadStatus && loadStatus.phase === "loading");

  function buttonLabel(): string {
    if (downloading && loadStatus) {
      return `Downloading model… ${Math.round(loadStatus.progress)}%`;
    }
    if (pending) return "Embedding…";
    return "Embed";
  }
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => {
      setElapsedMs(performance.now() - startMsRef.current);
    }, 100);
    return () => {
      window.clearInterval(id);
    };
  }, [pending]);

  useEffect(() => {
    if (!pending) {
      setLoadStatus(null);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const { data, error } = await getElysiaTreaty().embedding.models.load.get();
        if (error || !data) return;
        if (!cancelled) setLoadStatus(data);
      } catch {
        // Ignore poll failures; the embed request carries the real error.
      }
    }

    void poll();
    const id = window.setInterval(() => {
      void poll();
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pending]);

  function handleCancel() {
    abortRef.current?.abort();
    if (loadStatus?.phase === "loading") {
      void getElysiaTreaty()
        .embedding.models.cancel.post()
        .catch(() => {
          // best-effort unload
        });
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || pending || tooLong) return;

    const abort = new AbortController();
    abortRef.current?.abort();
    abortRef.current = abort;

    startMsRef.current = performance.now();
    setElapsedMs(0);
    setDurationMs(null);
    setLoadStatus((prev) => ({
      phase: "loading",
      progress: 0,
      dtype: prev?.dtype ?? "q8",
    }));
    setPending(true);
    setError(null);
    try {
      const { data, error } = await getElysiaTreaty().embedding.embed.post(
        { text: trimmed, mode },
        { fetch: { signal: abort.signal } },
      );
      if (abort.signal.aborted) return;
      if (error) throw new Error(treatyErrorMessage(error));
      if (!data) throw new Error("Embed returned no data");
      const ms = performance.now() - startMsRef.current;
      setElapsedMs(ms);
      setDurationMs(ms);
      setResult(data);
      setLoadStatus((prev) => ({
        phase: "ready",
        progress: 100,
        dtype: prev?.dtype ?? "q8",
      }));
    } catch (caught) {
      if (abort.signal.aborted || isAbortError(caught)) {
        setError(null);
        setDurationMs(null);
        return;
      }
      setError(formatEmbedError(caught));
      setResult(null);
      setDurationMs(null);
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" data-test="embed-playground-page">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Embed</h1>
        <p className="text-sm text-muted-foreground">
          Local EmbeddingGemma for {user}. First run downloads the quantized model (~300MB) once;
          later embeds should be much faster. Nothing is saved yet.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="embed-text">Text</Label>
          <Textarea
            id="embed-text"
            value={text}
            placeholder="Paste a repo description, README snippet, or search query…"
            rows={6}
            data-test="embed-text-input"
            disabled={pending}
            aria-invalid={tooLong || undefined}
            aria-describedby={tooLong ? "embed-text-error" : "embed-text-stats"}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
          />
          <div
            id="embed-text-stats"
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs tabular-nums text-muted-foreground"
          >
            <span
              className={cn(tooManyWords && "font-medium text-destructive")}
              data-test="embed-word-count"
            >
              {wordCount.toLocaleString()} / {EMBED_TEXT_MAX_WORDS.toLocaleString()} words
            </span>
            <span
              className={cn(tooLong && "font-medium text-destructive")}
              data-test="embed-char-count"
            >
              {charCount.toLocaleString()} / {EMBED_TEXT_MAX_CHARS.toLocaleString()} chars
            </span>
          </div>
          {tooLong ? (
            <p
              id="embed-text-error"
              className="text-sm text-destructive"
              role="alert"
              data-test="embed-text-too-long"
            >
              Text is too long — shorten by {(charCount - EMBED_TEXT_MAX_CHARS).toLocaleString()}{" "}
              characters to embed.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-40 flex-col gap-2">
            <Label htmlFor="embed-mode">Mode</Label>
            <Select
              value={mode}
              disabled={pending}
              onValueChange={(value) => {
                if (value === "document" || value === "query") setMode(value);
              }}
            >
              <SelectTrigger id="embed-mode" data-test="embed-mode-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document (index)</SelectItem>
                <SelectItem value="query">Query (search)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 sm:ml-auto">
            {pending || durationMs != null ? (
              <span className="text-xs tabular-nums text-muted-foreground" data-test="embed-timing">
                {pending
                  ? `Elapsed ${formatDuration(elapsedMs)}`
                  : `Took ${formatDuration(durationMs ?? 0)}`}
              </span>
            ) : null}
            <div className="flex gap-2">
              {pending ? (
                <Button
                  type="button"
                  variant="outline"
                  data-test="embed-cancel"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={!canSubmit} data-test="embed-submit">
                <Sparkles className="size-4" aria-hidden />
                {buttonLabel()}
              </Button>
            </div>
          </div>
        </div>

        {pending && loadStatus?.phase === "loading" ? (
          <div className="flex flex-col gap-2" data-test="embed-download-progress">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="min-w-0 truncate">
                {loadStatus.file ? `Fetching ${loadStatus.file}` : "Downloading model weights…"}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums">{Math.round(loadStatus.progress)}%</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7"
                  data-test="embed-download-cancel"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
            <Progress value={loadStatus.progress} />
          </div>
        ) : null}
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert" data-test="embed-error">
          {error}
        </p>
      ) : null}

      {result ? <EmbedResultPanel result={result} durationMs={durationMs} /> : null}
    </div>
  );
}

function EmbedResultPanel({
  result,
  durationMs,
}: {
  result: EmbedTextResult;
  durationMs: number | null;
}) {
  const preview = result.embedding.slice(0, PREVIEW_DIMS);
  const json = JSON.stringify(result.embedding);

  async function copyVector() {
    await navigator.clipboard.writeText(json);
  }

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4" data-test="embed-result">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Model <span className="text-foreground">{result.modelId}</span>
        </span>
        <span>
          Dims <span className="text-foreground">{result.dimensions}</span>
        </span>
        <span>
          Mode <span className="text-foreground">{result.mode}</span>
        </span>
        {durationMs != null ? (
          <span data-test="embed-result-timing">
            Wall <span className="tabular-nums text-foreground">{formatDuration(durationMs)}</span>
          </span>
        ) : null}
        <span data-test="embed-result-load">
          Load{" "}
          <span className="tabular-nums text-foreground">
            {formatDuration(result.timing.loadMs)}
          </span>
        </span>
        <span data-test="embed-result-infer">
          Infer{" "}
          <span className="tabular-nums text-foreground">
            {formatDuration(result.timing.embedMs)}
          </span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="sm:ml-auto"
          data-test="embed-copy"
          onClick={() => {
            void copyVector();
          }}
        >
          Copy vector JSON
        </Button>
      </div>

      <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed text-foreground">
        [{preview.map((n) => n.toFixed(5)).join(", ")}
        {result.embedding.length > PREVIEW_DIMS ? ", …" : ""}]
      </pre>
    </section>
  );
}

/** Formats ms as `842 ms` or `1.24 s`. */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function isAbortError(caught: unknown): boolean {
  return caught instanceof DOMException
    ? caught.name === "AbortError"
    : caught instanceof Error && caught.name === "AbortError";
}

/** Prefer a short message over Zod’s JSON dump. */
function formatEmbedError(caught: unknown): string {
  if (!(caught instanceof Error)) {
    return "Embedding failed. Check the server logs.";
  }

  const raw = caught.message.trim();
  if (raw.startsWith("[")) {
    try {
      const issues = JSON.parse(raw) as Array<{ message?: string; code?: string }>;
      const tooBig = issues.find((issue) => issue.code === "too_big");
      if (tooBig) {
        return `Text is too long (max ${EMBED_TEXT_MAX_CHARS.toLocaleString()} characters).`;
      }
      const first = issues.find((issue) => issue.message)?.message;
      if (first) return first;
    } catch {
      // fall through
    }
  }

  return raw || "Embedding failed. Check the server logs.";
}
