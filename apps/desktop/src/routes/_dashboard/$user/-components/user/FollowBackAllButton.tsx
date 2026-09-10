import { Button } from "@/components/ui/button";
import { GithubMissingScopeDialog } from "@/routes/_dashboard/-components/GithubMissingScopeDialog";
import {
  isMissingFollowScope,
  setViewerIsFollowing,
} from "@/routes/_dashboard/$user/-components/user/follow-user-shared";
import { useState } from "react";
import { commitLocalUpdate, graphql, useMutation, useRelayEnvironment } from "react-relay";
import { toast } from "sonner";
import type { FollowBackAllButtonMutation } from "./__generated__/FollowBackAllButtonMutation.graphql";

export type FollowBackTarget = {
  id: string;
  login: string;
};

type FollowBackAllButtonProps = {
  /** Loaded users who follow the viewer but are not followed yet. */
  targets: readonly FollowBackTarget[];
};

/**
 * Follows every eligible loaded user (sequential). Count grows as more pages load.
 */
export function FollowBackAllButton({ targets }: FollowBackAllButtonProps) {
  const environment = useRelayEnvironment();
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
        data-test="follow-back-all"
        onClick={() => {
          const queue = [...targets];
          const total = queue.length;
          const failures: { login: string; message: string }[] = [];
          setProgress({ done: 0, total });

          const revertOptimistic = (userId: string) => {
            commitLocalUpdate(environment, (store) => {
              setViewerIsFollowing(store, userId, false);
            });
          };

          const finish = () => {
            setProgress(null);
            if (failures.length === 0) return;
            if (failures.length === total) {
              toast.error(
                `Failed to follow back ${failures.length} user${failures.length === 1 ? "" : "s"}`,
                {
                  description: failures
                    .map((item) => `@${item.login}: ${item.message}`)
                    .join("; "),
                },
              );
              return;
            }
            toast.message("Follow back finished with mixed results", {
              description: `${total - failures.length} followed, ${failures.length} failed. ${failures
                .map((item) => `@${item.login}: ${item.message}`)
                .join("; ")}`,
            });
          };

          const recordFailure = (login: string, message: string, userId: string) => {
            failures.push({ login, message });
            revertOptimistic(userId);
          };

          const runNext = (index: number) => {
            if (index >= queue.length) {
              finish();
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
                  revertOptimistic(target.id);
                  setScopeDialogOpen(true);
                  setProgress(null);
                  return;
                }
                if (errors?.length) {
                  recordFailure(
                    target.login,
                    errors[0]?.message ?? "Follow request failed.",
                    target.id,
                  );
                }
                setProgress({ done: index + 1, total });
                runNext(index + 1);
              },
              onError: (error) => {
                if (isMissingFollowScope([error])) {
                  revertOptimistic(target.id);
                  setScopeDialogOpen(true);
                  setProgress(null);
                  return;
                }
                recordFailure(target.login, error.message, target.id);
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
