import { Button } from "@/components/ui/button";
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
 */
export function FollowUserButton({ user, size = "sm", className }: FollowUserButtonProps) {
  const data = useFragment(FollowUserButtonFragment, user);
  const [following, setFollowing] = useState(data.viewerIsFollowing);
  const [followMutation] = useMutation<FollowUserButtonfollowMutation>(FOLLOW_USER);
  const [unfollowMutation] = useMutation<FollowUserButtonunfollowMutation>(UNFOLLOW_USER);

  if (data.isViewer) return null;

  const label = following ? "Unfollow" : data.isFollowingViewer ? "Follow back" : "Follow";

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size={size}
      className={className}
      data-test={following ? `user-unfollow-${data.login}` : `user-follow-${data.login}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (following) {
          setFollowing(false);
          unfollowMutation({ variables: { input: { userId: data.id } } });
          return;
        }
        setFollowing(true);
        followMutation({ variables: { input: { userId: data.id } } });
      }}
    >
      {label}
    </Button>
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
