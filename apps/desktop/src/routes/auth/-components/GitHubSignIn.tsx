import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient, authClientErrorMessage } from "@/lib/auth-client";
import { desktopNavigate, hasDesktopBindings } from "@/lib/desktop-bindings";
import { clientEnv } from "@/lib/envs/client-env";
import {
  buildGithubOAuthScopes,
  GITHUB_OPTIONAL_SCOPES,
  type GithubOptionalScopeId,
} from "@repo/auth";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Better Auth resolves relative `callbackURL` against the API `baseURL`.
 */
function toAppCallbackURL(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = clientEnv.VITE_APP_URL.replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

type GitHubSignInProps = {
  callbackURL: string;
  /** Optional scopes pre-checked (e.g. from a missing-scope re-login). */
  initialOptionalScopes?: readonly GithubOptionalScopeId[];
};

/**
 * Desktop (Deno): system-browser OAuth via apps/api `electron()` + loopback/paste.
 * Browser (`pnpm dev`): same-origin social redirect (local Better Auth).
 */
export function GitHubSignIn({ callbackURL, initialOptionalScopes = [] }: GitHubSignInProps) {
  const navigate = useNavigate();
  const isDesktop = hasDesktopBindings();
  const [selected, setSelected] = useState<Set<GithubOptionalScopeId>>(() => {
    const next = new Set<GithubOptionalScopeId>(GITHUB_OPTIONAL_SCOPES.map((scope) => scope.id));
    for (const id of initialOptionalScopes) next.add(id);
    return next;
  });
  const [manualCode, setManualCode] = useState("");
  const [awaitingBrowser, setAwaitingBrowser] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;

    const finish = () => {
      setAwaitingBrowser(false);
      toast.success("Signed in");
      void navigate({ href: callbackURL });
    };

    const onAuthenticated = () => {
      finish();
    };
    const onAuthError = (event: Event) => {
      setAwaitingBrowser(false);
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      toast.error(detail?.message ?? "Authentication failed");
    };

    window.addEventListener("tangerine:authenticated", onAuthenticated);
    window.addEventListener("tangerine:auth-error", onAuthError);
    return () => {
      window.removeEventListener("tangerine:authenticated", onAuthenticated);
      window.removeEventListener("tangerine:auth-error", onAuthError);
    };
  }, [callbackURL, isDesktop, navigate]);

  // Backup: CEF often drops executeJs events — poll Deno session while waiting.
  useEffect(() => {
    if (!isDesktop || !awaitingBrowser || !globalThis.bindings) return;

    const id = setInterval(() => {
      void globalThis.bindings?.getSession().then((session) => {
        if (!session?.user) return;
        setAwaitingBrowser(false);
        toast.success("Signed in");
        void navigate({ href: callbackURL });
      });
    }, 800);

    return () => clearInterval(id);
  }, [awaitingBrowser, callbackURL, isDesktop, navigate]);

  const browserSignIn = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: toAppCallbackURL(callbackURL),
        scopes: buildGithubOAuthScopes([...selected]),
        disableRedirect: true,
      });
      if (result.error) {
        throw new Error(authClientErrorMessage(result.error) ?? "GitHub sign-in failed.");
      }
      const url = result.data?.url;
      if (!url) {
        throw new Error("GitHub sign-in did not return a redirect URL.");
      }
      await desktopNavigate(url);
      return result.data;
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message);
    },
  });

  const desktopSignIn = useMutation({
    mutationFn: async () => {
      if (!globalThis.bindings) {
        throw new Error("Desktop bindings unavailable");
      }
      setAwaitingBrowser(true);
      // Open web `/auth` (not init-oauth-proxy) so `loopback` can complete the return.
      await globalThis.bindings.requestAuth();
    },
    onError: (error) => {
      setAwaitingBrowser(false);
      console.error(error);
      toast.error(error.message);
    },
  });

  const pasteCode = useMutation({
    mutationFn: async (token: string) => {
      if (!globalThis.bindings) {
        throw new Error("Desktop bindings unavailable");
      }
      return await globalThis.bindings.authenticate({ token });
    },
    onSuccess: () => {
      toast.success("Signed in");
      void navigate({ href: callbackURL });
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message);
    },
  });

  const isPending =
    browserSignIn.isPending || desktopSignIn.isPending || pasteCode.isPending || awaitingBrowser;

  return (
    <div className="space-y-5">
      {!isDesktop ? (
        <fieldset className="space-y-3" data-test="auth-optional-scopes">
          <legend className="text-landing-fg-muted text-xs font-medium tracking-wide uppercase">
            Optional permissions
          </legend>
          <p className="text-landing-fg-muted text-xs leading-5">
            Base access covers browsing repos and stars. Turn these on only if you need them.
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
      ) : (
        <p className="text-landing-fg-muted text-sm leading-6" data-test="auth-desktop-hint">
          Sign-in opens your system browser against the API. After GitHub authorizes, you return via
          a local loopback callback — or paste the auth token below if the redirect fails.
        </p>
      )}

      <button
        type="button"
        className="landing-cta-primary w-full disabled:pointer-events-none disabled:opacity-60"
        data-test="auth-github-sign-in"
        disabled={isPending}
        onClick={() => {
          if (isDesktop) desktopSignIn.mutate();
          else browserSignIn.mutate();
        }}
      >
        <Github className="size-4" aria-hidden />
        {isPending
          ? awaitingBrowser
            ? "Waiting for browser…"
            : "Redirecting…"
          : isDesktop
            ? "Sign in with browser"
            : "Sign in with GitHub"}
      </button>

      {isDesktop ? (
        <label className="text-landing-fg-muted grid gap-2 text-xs" data-test="auth-manual-code">
          Manual auth token (loopback fallback)
          <input
            className="border-landing-border bg-landing-surface-raised text-landing-fg rounded-md border px-3 py-2 font-mono text-sm"
            value={manualCode}
            placeholder="Paste redirect token from the browser"
            disabled={pasteCode.isPending}
            onChange={(event) => {
              const value = event.target.value.trim();
              setManualCode(value);
              // Full redirect token is base64url JSON (longer than the 32-char identifier).
              if (value.length >= 32) {
                pasteCode.mutate(value);
              }
            }}
          />
        </label>
      ) : null}
    </div>
  );
}
