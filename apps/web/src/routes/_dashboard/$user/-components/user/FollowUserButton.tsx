import { Button } from "@/components/ui/button";
import { GithubMissingScopeDialog } from "@/routes/_dashboard/-components/GithubMissingScopeDialog";
import {
  isMissingFollowScope,
  setViewerIsFollowing,
} from "@/routes/_dashboard/$user/-components/user/follow-user-shared";
import { useState } from "react";
import { graphql, useFragment, useMutation } from "react-relay";
import type { FollowUserButton_user$key } from "./__generated__/FollowUserButton_user.graphql";
import type { FollowUserButtonfollowMutation } from "./__generated__/FollowUserButtonfollowMutation.graphql";
import type { FollowUserButtonunfollowMutation } from "./__generated__/FollowUserButtonunfollowMutation.graphql";

interface FollowUserButtonProps {
  user: FollowUserButton_user$key;
  /** Optional size override for dense lists vs profile header. */
  size?: "sm" | "xs";
  className?: string;
}

/**
 * Follow / Unfollow / Follow back control for a GitHub user.
 * Hidden when the target is the signed-in viewer.
 * Updates Relay `viewerIsFollowing` so bulk follow-back stays in sync.
 */
export function FollowUserButton({ user, size = "sm", className }: FollowUserButtonProps) {
  const data = useFragment(FollowUserButtonFragment, user);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [followMutation, isFollowPending] = useMutation<FollowUserButtonfollowMutation>(FOLLOW_USER);
  const [unfollowMutation, isUnfollowPending] =
    useMutation<FollowUserButtonunfollowMutation>(UNFOLLOW_USER);

  if (data.isViewer) return null;

  const following = data.viewerIsFollowing;
  const pending = isFollowPending || isUnfollowPending;
  const label = following ? "Unfollow" : data.isFollowingViewer ? "Follow back" : "Follow";

  return (
    <>
      <Button
        type="button"
        variant={following ? "outline" : "default"}
        size={size}
        className={className}
        disabled={pending}
        data-test={following ? `user-unfollow-${data.login}` : `user-follow-${data.login}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (following) {
            unfollowMutation({
              variables: { input: { userId: data.id } },
              optimisticUpdater: (store) => {
                setViewerIsFollowing(store, data.id, false);
              },
              updater: (store) => {
                setViewerIsFollowing(store, data.id, false);
              },
              onCompleted: (_response, errors) => {
                if (isMissingFollowScope(errors)) setScopeDialogOpen(true);
              },
              onError: (error) => {
                if (isMissingFollowScope([error])) setScopeDialogOpen(true);
              },
            });
            return;
          }
          followMutation({
            variables: { input: { userId: data.id } },
            optimisticUpdater: (store) => {
              setViewerIsFollowing(store, data.id, true);
            },
            updater: (store) => {
              setViewerIsFollowing(store, data.id, true);
            },
            onCompleted: (_response, errors) => {
              if (isMissingFollowScope(errors)) setScopeDialogOpen(true);
            },
            onError: (error) => {
              if (isMissingFollowScope([error])) setScopeDialogOpen(true);
            },
          });
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

const FollowUserButtonFragment = graphql`
  fragment FollowUserButton_user on User {
    id
    login
    isViewer
    isFollowingViewer
    viewerIsFollowing
  }
`;

const FOLLOW_USER = graphql`
  mutation FollowUserButtonfollowMutation($input: FollowUserInput!) {
    followUser(input: $input) {
      clientMutationId
    }
  }
`;

const UNFOLLOW_USER = graphql`
  mutation FollowUserButtonunfollowMutation($input: UnfollowUserInput!) {
    unfollowUser(input: $input) {
      clientMutationId
    }
  }
`;
