import { GithubMissingScopeDialog } from "@/routes/_dashboard/-components/GithubMissingScopeDialog";

type DeleteRepoScopeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Prompts re-login when bulk delete fails because `delete_repo` is missing.
 */
export function DeleteRepoScopeDialog({ open, onOpenChange }: DeleteRepoScopeDialogProps) {
  return (
    <GithubMissingScopeDialog
      open={open}
      onOpenChange={onOpenChange}
      scope="delete_repo"
      testId="delete-repo-scope"
      title="Delete permission needed"
      description={
        <>
          Your GitHub session does not include the <code className="font-mono">delete_repo</code>{" "}
          scope. Sign in again to grant it, then retry the delete.
        </>
      }
    />
  );
}
