import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient, authClientErrorMessage } from "@/lib/auth-client";
import {
  buildGithubOAuthScopes,
  GITHUB_OPTIONAL_SCOPES,
  type GithubOptionalScopeId,
} from "@repo/auth";
import { useMutation } from "@tanstack/react-query";
import { Github } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type GitHubSignInProps = {
  callbackURL: string;
  /** Optional scopes pre-checked (e.g. from a missing-scope re-login). */
  initialOptionalScopes?: readonly GithubOptionalScopeId[];
};

export function GitHubSignIn({ callbackURL, initialOptionalScopes = [] }: GitHubSignInProps) {
  const [selected, setSelected] = useState<Set<GithubOptionalScopeId>>(
    () => new Set(initialOptionalScopes),
  );

  const { mutate: handleSignIn, isPending } = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL,
        scopes: buildGithubOAuthScopes([...selected]),
      });
      if (result.error) {
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
                  <Label htmlFor={id} className="text-landing-fg cursor-pointer text-sm font-medium">
                    {scope.label}
                    <span className="text-landing-fg-muted ml-1.5 font-mono text-xs font-normal">
                      {scope.id}
                    </span>
                  </Label>
                  <p className="text-landing-fg-muted mt-0.5 text-xs leading-5">{scope.description}</p>
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
    </div>
  );
}
