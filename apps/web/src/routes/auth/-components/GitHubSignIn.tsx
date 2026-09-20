import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient, authClientErrorMessage } from "@/lib/auth-client";
import { clientEnv } from "@/lib/envs/client-env";
import {
  buildGithubOAuthScopes,
  GITHUB_OPTIONAL_SCOPES,
  type GithubOptionalScopeId,
} from "@repo/auth";
import { useMutation } from "@tanstack/react-query";
import { Github } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const AWAITING_DESKTOP_HANDOFF_KEY = "tangerine:awaiting-desktop-handoff";

/**
 * Better Auth resolves relative `callbackURL` against `BETTER_AUTH_URL` (web).
 * Pass absolute app URLs so post-login paths like `/viewer` stay on this origin.
 */
function toAppCallbackURL(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = clientEnv.VITE_APP_URL.replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function readAwaitingDesktopHandoff(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(AWAITING_DESKTOP_HANDOFF_KEY) === "1";
}

function markAwaitingDesktopHandoff(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(AWAITING_DESKTOP_HANDOFF_KEY, "1");
}

function clearAwaitingDesktopHandoff(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(AWAITING_DESKTOP_HANDOFF_KEY);
}

type ElectronAuthQuery = {
  client_id?: string;
  state?: string;
  code_challenge?: string;
};

type GitHubSignInProps = {
  callbackURL: string;
  /** Optional scopes pre-checked (e.g. from a missing-scope re-login). */
  initialOptionalScopes?: readonly GithubOptionalScopeId[];
  /** PKCE / Electron deep-link params — preserve on `signIn.social`. */
  electronQuery?: ElectronAuthQuery;
  /**
   * Deno Desktop loopback URL. When set, redirect the auth code here (query `token=`)
   * instead of the custom scheme — Deno does not deliver open-url yet.
   */
  loopback?: string;
};

export function GitHubSignIn({
  callbackURL,
  initialOptionalScopes = [],
  electronQuery,
  loopback,
}: GitHubSignInProps) {
  const [selected, setSelected] = useState<Set<GithubOptionalScopeId>>(() => {
    // Default all optional scopes on; caller can still pass extras to force-on.
    const next = new Set<GithubOptionalScopeId>(GITHUB_OPTIONAL_SCOPES.map((scope) => scope.id));
    for (const id of initialOptionalScopes) next.add(id);
    return next;
  });
  const [shownCode, setShownCode] = useState<string | null>(null);
  // Survives the GitHub redirect via sessionStorage; must be set by Sign in click.
  const [awaitingHandoff, setAwaitingHandoff] = useState(readAwaitingDesktopHandoff);

  useEffect(() => {
    if (!electronQuery?.state || !electronQuery.code_challenge) {
      if (!loopback) {
        const id = authClient.ensureElectronRedirect();
        return () => {
          clearInterval(id);
        };
      }
      return;
    }

    // Do not poll transferUser until the user clicks Sign in (avoids firing while
    // they are still toggling scopes, or when a prior web session already exists).
    if (!loopback || !awaitingHandoff) return;

    let cancelled = false;
    const redirectCookieName = "better-auth.electron";

    const encodeRedirectToken = (identifier: string, state: string) => {
      const json = JSON.stringify({ identifier, state });
      const bytes = new TextEncoder().encode(json);
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };

    let handedOff = false;

    const finishHandoff = () => {
      handedOff = true;
      clearAwaitingDesktopHandoff();
      setAwaitingHandoff(false);
    };

    const sendToLoopback = async (token: string) => {
      if (!loopback || cancelled || handedOff) return false;
      setShownCode(token);
      const target = new URL(loopback);
      target.searchParams.set("token", token);
      try {
        const res = await fetch(target.toString(), {
          headers: { accept: "application/json" },
        });
        if (res.ok) {
          finishHandoff();
          toast.success("Signed in — return to Tangerine Desktop.");
          // Hard navigate so a mid-flight social redirect cannot bounce us back to /auth.
          window.location.replace("/auth/desktop-done");
          return true;
        }
        let detail = "";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) detail = `: ${body.error}`;
        } catch {
          // ignore
        }
        toast.error(`Desktop loopback rejected the token${detail}. Paste it into the app.`);
      } catch {
        toast.error(
          "Desktop loopback is not running. Paste the token into Tangerine Desktop (restart the app if paste fails).",
        );
      }
      finishHandoff();
      return true;
    };

    const tryHandoff = async () => {
      if (handedOff || cancelled) return true;
      try {
        const transferred = await authClient.electron.transferUser({
          fetchOptions: { query: electronQuery },
        });
        const identifier = transferred.data?.electron_authorization_code;
        if (identifier && electronQuery.state) {
          return await sendToLoopback(encodeRedirectToken(identifier, electronQuery.state));
        }
      } catch {
        // Not signed in yet — keep polling.
      }

      if (handedOff || cancelled) return true;

      const fromCookie =
        typeof document !== "undefined"
          ? document.cookie
              .split("; ")
              .find((row) => row.startsWith(`${redirectCookieName}=`))
              ?.split("=")
              .slice(1)
              .join("=")
          : null;
      if (fromCookie) {
        return await sendToLoopback(decodeURIComponent(fromCookie));
      }

      const nested = authClient.electron.getAuthorizationCode?.();
      if (nested) {
        return await sendToLoopback(nested);
      }
      return false;
    };

    const timeout = 90_000;
    const start = Date.now();
    const id = setInterval(() => {
      void tryHandoff().then((done) => {
        if (done || Date.now() - start > timeout) clearInterval(id);
      });
    }, 400);
    void tryHandoff();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [electronQuery, loopback, awaitingHandoff]);

  const { mutate: handleSignIn, isPending } = useMutation({
    mutationFn: async () => {
      if (loopback) {
        // Existing web session: hand off to desktop only. Starting social here races —
        // transferUser succeeds, clears the awaiting flag, then GitHub redirects back
        // to /auth with nothing left to hand off (stuck on Sign in).
        const existing = await authClient.getSession();
        if (existing.data?.session) {
          markAwaitingDesktopHandoff();
          setAwaitingHandoff(true);
          return { mode: "handoff-only" as const };
        }
        // Not signed in: flag survives the GitHub round-trip; handoff runs on return.
        markAwaitingDesktopHandoff();
      }

      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: loopback
          ? // Stay on /auth after OAuth so the handoff effect can run.
            typeof window !== "undefined"
            ? `${window.location.origin}/auth${window.location.search}`
            : toAppCallbackURL(callbackURL)
          : toAppCallbackURL(callbackURL),
        scopes: buildGithubOAuthScopes([...selected]),
        fetchOptions: electronQuery ? { query: electronQuery } : undefined,
      });
      if (result.error) {
        if (loopback) {
          clearAwaitingDesktopHandoff();
          setAwaitingHandoff(false);
        }
        throw new Error(authClientErrorMessage(result.error) ?? "GitHub sign-in failed.");
      }
      return result.data;
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-5">
      <fieldset className="space-y-3" data-test="auth-optional-scopes">
        <legend className="text-landing-fg-muted text-xs font-medium tracking-wide uppercase">
          Optional permissions
        </legend>
        <p className="text-landing-fg-muted text-xs leading-5">
          Extra GitHub permissions (on by default). Uncheck any you do not need.
        </p>
        <ul className="space-y-3">
          {GITHUB_OPTIONAL_SCOPES.map((scope) => {
            const checked = selected.has(scope.id);
            const id = `auth-scope-${scope.id}`;
            return (
              <li key={scope.id} className="flex items-start gap-3">
                <Checkbox
                  id={id}
                  checked={checked}
                  data-test={`auth-scope-${scope.id}`}
                  disabled={isPending}
                  onCheckedChange={(value) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (value === true) next.add(scope.id);
                      else next.delete(scope.id);
                      return next;
                    });
                  }}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <Label
                    htmlFor={id}
                    className="text-landing-fg cursor-pointer text-sm font-medium"
                  >
                    {scope.label}
                    <span className="text-landing-fg-muted ml-1.5 font-mono text-xs font-normal">
                      {scope.id}
                    </span>
                  </Label>
                  <p className="text-landing-fg-muted mt-0.5 text-xs leading-5">
                    {scope.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <button
        type="button"
        className="landing-cta-primary w-full disabled:pointer-events-none disabled:opacity-60"
        data-test="auth-github-sign-in"
        disabled={isPending}
        onClick={() => {
          handleSignIn();
        }}
      >
        <Github className="size-4" aria-hidden />
        {isPending ? "Redirecting…" : "Sign in with GitHub"}
      </button>

      {shownCode ? (
        <div
          className="border-landing-border bg-landing-surface-raised space-y-2 rounded-lg border p-3"
          data-test="auth-desktop-code"
        >
          <p className="text-landing-fg text-sm font-medium">Desktop auth token</p>
          <p className="text-landing-fg-muted text-xs leading-5">
            If the app did not return automatically, copy this token and paste it into Tangerine
            Desktop.
          </p>
          <code className="text-landing-fg block break-all font-mono text-xs select-all">
            {shownCode}
          </code>
        </div>
      ) : null}
    </div>
  );
}
