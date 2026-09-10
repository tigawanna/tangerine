import { Star } from "lucide-react";
import { graphql, useMutation } from "react-relay";
import { toast } from "sonner";
import type { RepoCardStarButtonAddStarMutation } from "./__generated__/RepoCardStarButtonAddStarMutation.graphql";
import type { RepoCardStarButtonRemoveStarMutation } from "./__generated__/RepoCardStarButtonRemoveStarMutation.graphql";

type RepoCardStarButtonProps = {
  /** GraphQL repository node id. */
  id: string;
  /** Short repo name for `data-test`. */
  name: string;
  stargazerCount: number;
  viewerHasStarred: boolean;
};

/**
 * Compact star / unstar control for repository cards.
 * Uses Relay mutations so the store (and every fragment on this repo) stays in sync.
 */
export function RepoCardStarButton({
  id,
  name,
  stargazerCount,
  viewerHasStarred,
}: RepoCardStarButtonProps) {
  const [starMutation, isStarPending] =
    useMutation<RepoCardStarButtonAddStarMutation>(AddStarMutation);
  const [unstarMutation, isUnstarPending] =
    useMutation<RepoCardStarButtonRemoveStarMutation>(RemoveStarMutation);

  const pending = isStarPending || isUnstarPending;

  return (
    <button
      type="button"
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors disabled:opacity-50 ${
        viewerHasStarred
          ? "text-warning hover:bg-warning/10"
          : "text-base-content/45 hover:bg-base-300/60 hover:text-base-content/70"
      }`}
      aria-label={viewerHasStarred ? `Unstar ${name}` : `Star ${name}`}
      aria-pressed={viewerHasStarred}
      data-test={viewerHasStarred ? `repo-unstar-${name}` : `repo-star-${name}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (viewerHasStarred) {
          unstarMutation({
            variables: { starrableId: id },
            onError: (error) => {
              toast.error("Couldn’t unstar", { description: error.message });
            },
          });
          return;
        }
        starMutation({
          variables: { starrableId: id },
          onError: (error) => {
            toast.error("Couldn’t star", { description: error.message });
          },
        });
      }}
    >
      <Star
        className={`size-3.5 ${viewerHasStarred ? "fill-current" : ""} ${pending ? "animate-spin" : ""}`}
        aria-hidden
      />
      <span className="tabular-nums">{stargazerCount.toLocaleString()}</span>
    </button>
  );
}

const AddStarMutation = graphql`
  mutation RepoCardStarButtonAddStarMutation($starrableId: ID!) {
    addStar(input: { starrableId: $starrableId }) {
      starrable {
        id
        stargazerCount
        viewerHasStarred
      }
    }
  }
`;

const RemoveStarMutation = graphql`
  mutation RepoCardStarButtonRemoveStarMutation($starrableId: ID!) {
    removeStar(input: { starrableId: $starrableId }) {
      starrable {
        id
        stargazerCount
        viewerHasStarred
      }
    }
  }
`;
