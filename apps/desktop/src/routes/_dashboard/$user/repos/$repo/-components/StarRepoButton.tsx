import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { graphql, useMutation } from "react-relay";
import { toast } from "sonner";
import type { StarRepoButtonAddStarMutation } from "./__generated__/StarRepoButtonAddStarMutation.graphql";
import type { StarRepoButtonRemoveStarMutation } from "./__generated__/StarRepoButtonRemoveStarMutation.graphql";

type StarRepoButtonProps = {
  starrableId: string;
  stargazerCount: number;
  viewerHasStarred: boolean;
};

/**
 * Star / unstar control for the repo details header.
 * Relay mutation updates every fragment on this repository node.
 */
export function StarRepoButton({
  starrableId,
  stargazerCount,
  viewerHasStarred,
}: StarRepoButtonProps) {
  const [starMutation, isStarPending] = useMutation<StarRepoButtonAddStarMutation>(AddStarMutation);
  const [unstarMutation, isUnstarPending] =
    useMutation<StarRepoButtonRemoveStarMutation>(RemoveStarMutation);

  const pending = isStarPending || isUnstarPending;

  return (
    <Button
      type="button"
      variant={viewerHasStarred ? "secondary" : "outline"}
      size="sm"
      disabled={pending}
      data-test={viewerHasStarred ? "repo-unstar" : "repo-star"}
      onClick={() => {
        if (viewerHasStarred) {
          unstarMutation({
            variables: { starrableId },
            onError: (error) => {
              toast.error("Couldn’t unstar", { description: error.message });
            },
          });
          return;
        }
        starMutation({
          variables: { starrableId },
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
      {viewerHasStarred ? "Starred" : "Star"}
      <span className="text-base-content/50 tabular-nums">{stargazerCount.toLocaleString()}</span>
    </Button>
  );
}

const AddStarMutation = graphql`
  mutation StarRepoButtonAddStarMutation($starrableId: ID!) {
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
  mutation StarRepoButtonRemoveStarMutation($starrableId: ID!) {
    removeStar(input: { starrableId: $starrableId }) {
      starrable {
        id
        stargazerCount
        viewerHasStarred
      }
    }
  }
`;
