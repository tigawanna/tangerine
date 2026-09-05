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
import { useState } from "react";
import { toast } from "sonner";

type DeleteRepoScopeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Prompts re-login when bulk delete fails because `delete_repo` is missing.
 */
export function DeleteRepoScopeDialog({ open, onOpenChange }: DeleteRepoScopeDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-test="delete-repo-scope-dialog">
        <DialogHeader>
          <DialogTitle>Delete permission needed</DialogTitle>
          <DialogDescription>
            Your GitHub session does not include the <code className="font-mono">delete_repo</code>{" "}
            scope. Sign in again to grant it, then retry the delete.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            data-test="delete-repo-scope-dismiss"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Dismiss
          </Button>
          <Button
            type="button"
            disabled={pending}
            data-test="delete-repo-scope-relogin"
            onClick={() => {
              setPending(true);
              const returnTo = `${location.pathname}${location.searchStr}`;
              void authClient
                .signOut()
                .then(() => {
                  resetGithubRelayEnvironment();
                  return navigate({
                    to: "/auth",
                    search: { returnTo },
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
