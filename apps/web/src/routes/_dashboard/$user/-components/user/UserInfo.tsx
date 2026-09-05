import { Button } from "@/components/ui/button";
import { getRelativeTimeString } from "@/utils/date-helpers";
import { Building2, Mail, MapPin } from "lucide-react";
import { type ComponentType, useState } from "react";
import { graphql, useFragment, useMutation } from "react-relay";
import { FaXTwitter } from "react-icons/fa6";
import type { UserInfo$key } from "./__generated__/UserInfo.graphql";
import type { UserInfofollowMutation } from "./__generated__/UserInfofollowMutation.graphql";
import type { UserInfounfollowMutation } from "./__generated__/UserInfounfollowMutation.graphql";

interface UserInfoProps {
  user: UserInfo$key;
}

/**
 * Profile header for `/$user` — avatar, bio, meta, follow control.
 */
export function UserInfo({ user }: UserInfoProps) {
  const data = useFragment(UserInfoFragment, user);
  const [following, setFollowing] = useState(data.viewerIsFollowing);
  const [followMutation] = useMutation<UserInfofollowMutation>(FOLLOW_USER);
  const [unfollowMutation] = useMutation<UserInfounfollowMutation>(UNFOLLOW_USER);
  const joined = data.createdAt ? getRelativeTimeString(new Date(data.createdAt)) : null;

  return (
    <section
      className="border-base-300 bg-base-200/25 flex flex-col gap-6 rounded-2xl border p-5 md:flex-row md:items-start md:gap-8 md:p-6"
      data-test="user-info"
    >
      <img
        src={data.avatarUrl}
        alt=""
        className="border-base-300 size-28 shrink-0 rounded-2xl border object-cover md:size-36"
        data-test="user-avatar"
      />

      <div className="min-w-0 flex-1 space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {data.name ?? data.login}
          </h1>
          <p className="text-base-content/55 text-base">@{data.login}</p>
          {data.bio ? (
            <p className="text-base-content/75 max-w-2xl text-sm leading-6 md:text-base">
              {data.bio}
            </p>
          ) : null}
          {joined ? <p className="text-base-content/45 text-sm">Joined {joined}</p> : null}
        </div>

        <ul className="text-base-content/70 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <MetaItem icon={Building2} value={data.company} />
          <MetaItem icon={MapPin} value={data.location} />
          <MetaItem icon={Mail} value={data.email} />
          <MetaItem
            icon={FaXTwitter}
            value={data.twitterUsername ? `@${data.twitterUsername}` : null}
          />
        </ul>

        {!data.isViewer ? (
          <Button
            type="button"
            variant={following ? "outline" : "default"}
            size="sm"
            data-test={following ? "user-unfollow" : "user-follow"}
            onClick={() => {
              if (following) {
                setFollowing(false);
                unfollowMutation({ variables: { input: { userId: data.id } } });
                return;
              }
              setFollowing(true);
              followMutation({ variables: { input: { userId: data.id } } });
            }}
          >
            {following ? "Unfollow" : data.isFollowingViewer ? "Follow back" : "Follow"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function MetaItem({
  icon: Icon,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <li className="inline-flex items-center gap-1.5">
      <Icon className="text-base-content/40 size-3.5 shrink-0" aria-hidden />
      <span>{value}</span>
    </li>
  );
}

const UserInfoFragment = graphql`
  fragment UserInfo on User {
    id
    name
    login
    email
    bio
    avatarUrl
    company
    twitterUsername
    createdAt
    isFollowingViewer
    viewerIsFollowing
    isViewer
    location
    url
  }
`;

const FOLLOW_USER = graphql`
  mutation UserInfofollowMutation($input: FollowUserInput!) {
    followUser(input: $input) {
      clientMutationId
    }
  }
`;

const UNFOLLOW_USER = graphql`
  mutation UserInfounfollowMutation($input: UnfollowUserInput!) {
    unfollowUser(input: $input) {
      clientMutationId
    }
  }
`;
