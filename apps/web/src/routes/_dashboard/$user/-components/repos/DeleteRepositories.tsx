import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteGithubRepos } from "@/modules/github/repo-mutations";
import { useMutation } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { useRelayEnvironment } from "react-relay";
import { toast } from "sonner";
import type { SelectableRepo } from "./use-repo-selector";

interface DeleteRepositoriesProps {
  open: boolean;
  selected: SelectableRepo[];
  setOpen: (open: boolean) => void;
  setSelected: (selected: SelectableRepo[]) => void;
}

/**
 * Confirm + run bulk repository deletion for the current selection.
 */
export function DeleteRepositories({
  open,
  selected,
  setOpen,
  setSelected,
}: DeleteRepositoriesProps) {
  const environment = useRelayEnvironment();

  const mutation = useMutation({
    mutationFn: () => deleteGithubRepos({ data: { repos: selected } }),
    onSuccess: (data) => {
      setSelected([]);
      for (const item of data.successful) {
        environment.applyUpdate({
          storeUpdater: (store) => {
            store.delete(item.id);
          },
        });
      }

      if (data.failed.length === 0) {
        toast.success(`Deleted ${data.successful.length} repositor${data.successful.length === 1 ? "y" : "ies"}`);
      } else if (data.successful.length === 0) {
        toast.error(
          `Failed to delete: ${data.failed.map((item) => `${item.repo} (${item.issue})`).join("; ")}`,
        );
      } else {
        toast.message("Bulk delete finished with mixed results", {
          description: `${data.successful.length} deleted, ${data.failed.length} failed. ${data.failed
            .map((item) => `${item.repo}: ${item.issue}`)
            .join("; ")}`,
        });
      }

      setOpen(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Something went wrong deleting repositories.";
      toast.error(message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-2"
          data-test="repo-bulk-delete-trigger"
        >
          Delete
          <Trash className="size-4" aria-hidden />
          <span className="tabular-nums">({selected.length})</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-h-[90vh] overflow-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete selected repositories?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the repositories on GitHub. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="text-base-content/80 max-h-60 list-disc space-y-1 overflow-auto pl-5 text-sm">
          {selected.map((item) => (
            <li key={item.id} className="font-mono">
              {item.nameWithOwner}
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            data-test="repo-bulk-delete-confirm"
            onClick={() => {
              mutation.mutate();
            }}
          >
            {mutation.isPending ? "Deleting…" : "Delete forever"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
