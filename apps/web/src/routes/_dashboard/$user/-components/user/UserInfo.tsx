import { getRelativeTimeString } from "@/utils/date-helpers";
import { graphql, useFragment } from "react-relay";
import type { UserInfo$key } from "./__generated__/UserInfo.graphql";

interface UserInfoProps {
  user: UserInfo$key;
}

export function UserInfo({ user }: UserInfoProps) {
  const data = useFragment(UserInfoFragment, user);
  const joined = data.createdAt ? getRelativeTimeString(new Date(data.createdAt)) : null;

  return (
    <section className="space-y-6" data-test="user-info">
      <div className="space-y-3">
        <p className="text-base-content/60 text-sm tracking-[0.24em] uppercase">Profile</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{data.name ?? data.login}</h1>
        {data.bio ? (
          <p className="text-base-content/70 max-w-2xl text-base leading-7">{data.bio}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <img
          src={data.avatarUrl}
          alt=""
          className="border-base-300 size-20 rounded-full border"
          data-test="user-avatar"
        />
        <div className="space-y-1">
          <p className="text-lg font-semibold">{data.name ?? data.login}</p>
          <p className="text-base-content/60 text-sm">@{data.login}</p>
          {joined ? <p className="text-base-content/50 text-sm">Joined {joined}</p> : null}
        </div>
      </div>

      <dl className="text-base-content/70 grid gap-2 text-sm sm:grid-cols-2">
        {data.company ? (
          <div>
            <dt className="text-base-content/50">Company</dt>
            <dd>{data.company}</dd>
          </div>
        ) : null}
        {data.location ? (
          <div>
            <dt className="text-base-content/50">Location</dt>
            <dd>{data.location}</dd>
          </div>
        ) : null}
        {data.email ? (
          <div>
            <dt className="text-base-content/50">Email</dt>
            <dd>{data.email}</dd>
          </div>
        ) : null}
        {data.twitterUsername ? (
          <div>
            <dt className="text-base-content/50">Twitter</dt>
            <dd>@{data.twitterUsername}</dd>
          </div>
        ) : null}
      </dl>
    </section>
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
    location
    url
    isViewer
  }
`;
