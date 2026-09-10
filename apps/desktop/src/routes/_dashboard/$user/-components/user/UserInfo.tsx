import { getRelativeTimeString } from "@/utils/date-helpers";
import {
  Building2,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Twitch,
  Youtube,
} from "lucide-react";
import { type ComponentType } from "react";
import { FaGithub, FaMastodon, FaNpm, FaReddit, FaXTwitter } from "react-icons/fa6";
import { graphql, useFragment } from "react-relay";
import { FollowUserButton } from "./FollowUserButton";
import type { UserInfo$key } from "./__generated__/UserInfo.graphql";

interface UserInfoProps {
  user: UserInfo$key;
}

type SocialProvider =
  | "FACEBOOK"
  | "GENERIC"
  | "HOMETOWN"
  | "INSTAGRAM"
  | "LINKEDIN"
  | "MASTODON"
  | "NPM"
  | "REDDIT"
  | "TWITCH"
  | "TWITTER"
  | "YOUTUBE"
  | "%future added value";

/**
 * Profile header for `/$user` — avatar, bio, external links, languages, follow.
 */
export function UserInfo({ user }: UserInfoProps) {
  const data = useFragment(UserInfoFragment, user);
  const joined = data.createdAt ? getRelativeTimeString(new Date(data.createdAt)) : null;
  const profileUrl = data.url;
  const displayName = data.name ?? data.login;
  const languages = collectTopLanguages(data.topRepositories?.nodes ?? []);
  const socials =
    data.socialAccounts?.nodes?.filter(
      (account): account is NonNullable<typeof account> => account != null,
    ) ?? [];

  const websiteHref = normalizeExternalUrl(data.websiteUrl);
  const hasLinks =
    Boolean(data.email) ||
    Boolean(websiteHref) ||
    Boolean(data.twitterUsername) ||
    socials.some((account) => !(account.provider === "TWITTER" && data.twitterUsername));

  return (
    <section
      className="border-base-300 bg-base-200/25 flex flex-col items-center gap-5 rounded-2xl border p-4 sm:p-5 md:flex-row md:items-stretch md:gap-6 md:p-6"
      data-test="user-info"
    >
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full max-w-56 shrink-0 sm:max-w-64 md:max-w-none md:w-40 md:self-stretch lg:w-48"
        data-test="user-avatar-link"
        aria-label={`Open ${data.login} on GitHub`}
      >
        <img
          src={data.avatarUrl}
          alt=""
          className="border-base-300 aspect-square size-full rounded-2xl border object-cover md:aspect-auto md:h-full md:min-h-40"
          data-test="user-avatar"
        />
      </a>

      <div className="flex w-full min-w-0 flex-1 flex-col gap-5 md:flex-row md:gap-8">
        <div className="flex min-w-0 flex-1 flex-col items-center space-y-3 text-center md:items-start md:text-left">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                data-test="user-name-link"
              >
                {displayName}
              </a>
            </h1>
            <p className="text-base-content/55 text-sm sm:text-base">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary inline-flex items-center gap-1.5 transition-colors"
                data-test="user-login-link"
              >
                <FaGithub className="size-3.5 opacity-60" aria-hidden />@{data.login}
              </a>
            </p>
            {data.bio ? (
              <p className="text-base-content/75 mx-auto max-w-md text-sm leading-6 md:mx-0 md:text-base">
                {data.bio}
              </p>
            ) : null}
            {joined ? <p className="text-base-content/45 text-sm">Joined {joined}</p> : null}
          </div>

          <ul className="text-base-content/70 flex flex-col items-center gap-1.5 text-sm md:items-start">
            <MetaText icon={Building2} value={data.company} />
            <MetaText icon={MapPin} value={data.location} />
          </ul>

          <div className="flex justify-center md:justify-start">
            <FollowUserButton user={data} />
          </div>
        </div>

        {hasLinks || languages.length > 0 ? (
          <div className="flex w-full min-w-0 flex-col items-center gap-4 md:w-auto md:max-w-md md:shrink-0 md:items-start md:justify-center md:self-center">
            {hasLinks ? (
              <div className="space-y-2">
                <p className="text-base-content/45 text-center text-xs font-medium tracking-wide uppercase md:text-left">
                  Links
                </p>
                <ul
                  className="flex flex-wrap items-center justify-center gap-1 md:justify-start"
                  data-test="user-external-links"
                  aria-label="Profile links"
                >
                  <IconLink
                    icon={Mail}
                    href={data.email ? `mailto:${data.email}` : null}
                    label={data.email ? `Email ${data.email}` : null}
                    testId="user-email"
                  />
                  <IconLink
                    icon={Globe}
                    href={websiteHref}
                    label={
                      data.websiteUrl
                        ? `Website ${websiteLabel(data.websiteUrl) ?? data.websiteUrl}`
                        : null
                    }
                    testId="user-website"
                  />
                  <IconLink
                    icon={FaXTwitter}
                    href={data.twitterUsername ? `https://x.com/${data.twitterUsername}` : null}
                    label={data.twitterUsername ? `X @${data.twitterUsername}` : null}
                    testId="user-twitter"
                  />
                  {socials.map((account) => {
                    if (account.provider === "TWITTER" && data.twitterUsername) return null;
                    const Icon = socialIcon(account.provider);
                    const name = socialLabel(account.provider, account.displayName);
                    return (
                      <IconLink
                        key={`${account.provider}-${account.url}`}
                        icon={Icon}
                        href={normalizeExternalUrl(account.url)}
                        label={name}
                        testId={`user-social-${account.provider.toLowerCase()}`}
                      />
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {languages.length > 0 ? (
              <div className="space-y-2">
                <p className="text-base-content/45 text-center text-xs font-medium tracking-wide uppercase md:text-left">
                  Languages
                </p>
                <ul
                  className="flex flex-wrap justify-center gap-2 md:justify-start"
                  data-test="user-languages"
                  aria-label="Top languages"
                >
                  {languages.map((lang) => (
                    <li
                      key={lang.id}
                      className="border-base-300 bg-base-100/70 text-base-content/75 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: lang.color ?? "var(--color-base-content)" }}
                        aria-hidden
                      />
                      {lang.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MetaText({
  icon: Icon,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <li className="inline-flex min-w-0 items-center gap-1.5">
      <Icon className="text-base-content/40 size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{value}</span>
    </li>
  );
}

function IconLink({
  icon: Icon,
  href,
  label,
  testId,
}: {
  icon: ComponentType<{ className?: string }>;
  href: string | null | undefined;
  label: string | null | undefined;
  testId: string;
}) {
  if (!href || !label) return null;
  const isMail = href.startsWith("mailto:");
  return (
    <li>
      <a
        href={href}
        target={isMail ? undefined : "_blank"}
        rel={isMail ? undefined : "noopener noreferrer"}
        title={label}
        aria-label={label}
        className="text-base-content/55 hover:text-primary hover:bg-base-300/60 inline-flex size-8 items-center justify-center rounded-lg transition-colors"
        data-test={testId}
      >
        <Icon className="size-4" aria-hidden />
      </a>
    </li>
  );
}

/**
 * GitHub sometimes stores `websiteUrl` without a scheme — make it clickable.
 */
function normalizeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Prefer a short host label for website chips.
 */
function websiteLabel(url: string | null | undefined): string | null {
  const normalized = normalizeExternalUrl(url);
  if (!normalized) return null;
  try {
    return new URL(normalized).host.replace(/^www\./, "");
  } catch {
    return url ?? null;
  }
}

function socialIcon(provider: SocialProvider): ComponentType<{ className?: string }> {
  switch (provider) {
    case "LINKEDIN":
      return Linkedin;
    case "TWITTER":
      return FaXTwitter;
    case "FACEBOOK":
      return Facebook;
    case "INSTAGRAM":
      return Instagram;
    case "YOUTUBE":
      return Youtube;
    case "TWITCH":
      return Twitch;
    case "MASTODON":
      return FaMastodon;
    case "REDDIT":
      return FaReddit;
    case "NPM":
      return FaNpm;
    default:
      return Globe;
  }
}

function socialLabel(provider: SocialProvider, displayName: string): string {
  if (displayName.trim()) return displayName;
  switch (provider) {
    case "LINKEDIN":
      return "LinkedIn";
    case "TWITTER":
      return "X";
    case "FACEBOOK":
      return "Facebook";
    case "INSTAGRAM":
      return "Instagram";
    case "YOUTUBE":
      return "YouTube";
    case "TWITCH":
      return "Twitch";
    case "MASTODON":
      return "Mastodon";
    case "REDDIT":
      return "Reddit";
    case "NPM":
      return "npm";
    case "HOMETOWN":
      return "Hometown";
    default:
      return "Link";
  }
}

type LanguageNode = {
  readonly id: string;
  readonly name: string;
  readonly color: string | null | undefined;
};

/**
 * Rank primary languages from recent top repos (most frequent first).
 */
function collectTopLanguages(
  nodes:
    | ReadonlyArray<{ readonly primaryLanguage: LanguageNode | null | undefined } | null | undefined>
    | null
    | undefined,
): LanguageNode[] {
  if (!nodes) return [];

  const counts = new Map<string, { lang: LanguageNode; count: number }>();
  for (const node of nodes) {
    const lang = node?.primaryLanguage;
    if (!lang) continue;
    const existing = counts.get(lang.id);
    if (existing) {
      existing.count += 1;
      continue;
    }
    counts.set(lang.id, { lang, count: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.lang.name.localeCompare(b.lang.name))
    .slice(0, 6)
    .map((entry) => entry.lang);
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
    websiteUrl
    socialAccounts(first: 8) {
      nodes {
        provider
        url
        displayName
      }
    }
    topRepositories(first: 20, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes {
        primaryLanguage {
          id
          name
          color
        }
      }
    }
    ...FollowUserButton_user
  }
`;
