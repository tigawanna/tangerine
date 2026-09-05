import { graphql, useFragment } from "react-relay";
import type { OwnerCard$key } from "./__generated__/OwnerCard.graphql";

interface OwnerCardProps {
  owner: OwnerCard$key;
}

/**
 * Lightweight header for a `RepositoryOwner` (user or org).
 * Uses only interface fields so public orgs work without `read:org`.
 */
export function OwnerCard({ owner }: OwnerCardProps) {
  const data = useFragment(OwnerCardFragment, owner);
  const isOrg = data.__typename === "Organization";

  return (
    <section
      className="border-base-300 bg-base-200/25 flex flex-row items-start gap-4 rounded-2xl border p-4 sm:gap-6 sm:p-5 md:gap-8 md:p-6"
      data-test={isOrg ? "org-info" : "owner-card"}
    >
      <img
        src={data.avatarUrl}
        alt=""
        className="border-base-300 size-20 shrink-0 rounded-2xl border object-cover sm:size-28 md:size-36"
        data-test={isOrg ? "org-avatar" : "owner-avatar"}
      />

      <div className="min-w-0 flex-1 space-y-2">
        {isOrg ? (
          <p className="text-base-content/45 text-xs font-medium tracking-wide uppercase">
            Organization
          </p>
        ) : null}
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">{data.login}</h1>
        <p className="text-base-content/55 text-sm sm:text-base">@{data.login}</p>
        {data.url ? (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary text-sm hover:underline"
          >
            View on GitHub
          </a>
        ) : null}
      </div>
    </section>
  );
}

export const OwnerCardFragment = graphql`
  fragment OwnerCard on RepositoryOwner {
    __typename
    login
    avatarUrl
    url
  }
`;
