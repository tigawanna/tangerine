import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { resetGithubRelayEnvironment } from "@/lib/relay/create-environment";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Redo2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

type GithubMissingScopeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional scope to pre-check on the sign-in screen (e.g. `user:follow`). */
  scope: string;
  title: string;
  description: ReactNode;
  /** data-test prefix, e.g. `follow-scope` → `follow-scope-dialog`. */
  testId?: string;
};

/**
 * Prompts re-login when a GitHub action fails for a missing OAuth scope.
 * Signs out first so `/auth` does not bounce a still-valid session.
 */
export function GithubMissingScopeDialog({
  open,
  onOpenChange,
  scope,
  title,
  description,
  testId = "github-missing-scope",
}: GithubMissingScopeDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-test={`${testId}-dialog`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            data-test={`${testId}-dismiss`}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            disabled={pending}
            data-test={`${testId}-relogin`}
            onClick={() => {
              setPending(true);
              const returnTo = `${location.pathname}${location.searchStr}`;
              void authClient
                .signOut()
                .then(() => {
                  resetGithubRelayEnvironment();
                  return navigate({
                    to: "/auth",
                    search: { returnTo, optScopes: scope },
                  });
                })
                .catch((error: unknown) => {
                  setPending(false);
                  const message =
                    error instanceof Error ? error.message : "Could not start re-login.";
                  toast.error(message);
                });
            }}
          >
            {pending ? "Redirecting…" : "Sign in again"}
            <Redo2 className="size-4" aria-hidden />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
