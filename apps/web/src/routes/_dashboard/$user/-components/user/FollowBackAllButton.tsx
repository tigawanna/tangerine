import { Button } from "@/components/ui/button";
import { GithubMissingScopeDialog } from "@/routes/_dashboard/-components/GithubMissingScopeDialog";
import {
  isMissingFollowScope,
  setViewerIsFollowing,
} from "@/routes/_dashboard/$user/-components/user/follow-user-shared";
import { useState } from "react";
import { graphql, useMutation } from "react-relay";
import type { FollowBackAllButtonMutation } from "./__generated__/FollowBackAllButtonMutation.graphql";

export type FollowBackTarget = {
  id: string;
  login: string;
};

type FollowBackAllButtonProps = {
  /** Users in this loaded batch who follow the viewer but are not followed yet. */
  targets: readonly FollowBackTarget[];
  /** Which loaded page this control belongs to (for data-test). */
  batchIndex?: number;
};

/**
 * Follows every eligible user in the current loaded batch (sequential).
 */
export function FollowBackAllButton({ targets, batchIndex = 0 }: FollowBackAllButtonProps) {
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [commitFollow, isMutating] = useMutation<FollowBackAllButtonMutation>(FOLLOW_USER);

  if (targets.length === 0) return null;

  const pending = isMutating || progress !== null;
  const label = progress
    ? `Following ${progress.done}/${progress.total}…`
    : `Follow back all (${targets.length})`;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        data-test={`follow-back-all-${batchIndex}`}
        onClick={() => {
          const queue = [...targets];
          const total = queue.length;
          setProgress({ done: 0, total });

          const runNext = (index: number) => {
            if (index >= queue.length) {
              setProgress(null);
              return;
            }
            const target = queue[index]!;
            commitFollow({
              variables: { input: { userId: target.id } },
              optimisticUpdater: (store) => {
                setViewerIsFollowing(store, target.id, true);
              },
              updater: (store, data) => {
                if (data?.followUser) {
                  setViewerIsFollowing(store, target.id, true);
                }
              },
              onCompleted: (_response, errors) => {
                if (isMissingFollowScope(errors)) {
                  setScopeDialogOpen(true);
                  setProgress(null);
                  return;
                }
                setProgress({ done: index + 1, total });
                runNext(index + 1);
              },
              onError: (error) => {
                if (isMissingFollowScope([error])) {
                  setScopeDialogOpen(true);
                  setProgress(null);
                  return;
                }
                setProgress({ done: index + 1, total });
                runNext(index + 1);
              },
            });
          };

          runNext(0);
        }}
      >
        {label}
      </Button>
      <GithubMissingScopeDialog
        open={scopeDialogOpen}
        onOpenChange={setScopeDialogOpen}
        scope="user:follow"
        testId="follow-scope"
        title="Follow permission needed"
        description={
          <>
            Your GitHub session does not include the{" "}
            <code className="font-mono">user:follow</code> scope. Sign in again to grant it, then
            retry.
          </>
        }
      />
    </>
  );
}

const FOLLOW_USER = graphql`
  mutation FollowBackAllButtonMutation($input: FollowUserInput!) {
    followUser(input: $input) {
      clientMutationId
    }
  }
`;
