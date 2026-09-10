import { Building2, Globe, Mail, MapPin } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { landingMockUser } from "./data";

/**
 * Decorative profile header for landing — same silhouette as dashboard `UserInfo`,
 * fed by static John Doe mock data.
 */
export function LandingMockUserHeader({
  compact = false,
  dense = false,
}: {
  compact?: boolean;
  /** Tighter hero layout so repo cards stay visible in the crop. */
  dense?: boolean;
}) {
  const user = landingMockUser;

  if (compact) {
    return (
      <section
        className="border-base-300 bg-base-200/25 flex items-center gap-3 rounded-xl border p-3"
        data-test="landing-mock-user-header"
      >
        <div className="size-12 shrink-0 overflow-hidden rounded-xl">
          <img
            src={user.avatarUrl}
            alt=""
            className="size-full object-cover"
            data-test="landing-mock-avatar"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <h2 className="truncate text-sm font-bold tracking-tight">{user.name}</h2>
          <p className="text-base-content/55 inline-flex items-center gap-1.5 text-xs">
            <FaGithub className="size-3 opacity-60" aria-hidden />@{user.login}
          </p>
          <p className="text-base-content/55 truncate text-xs">{user.location}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={
        dense
          ? "border-base-300 bg-base-200/25 flex items-stretch gap-4 rounded-2xl border p-3 sm:p-4"
          : "border-base-300 bg-base-200/25 flex flex-col items-center gap-4 rounded-2xl border p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5"
      }
      data-test="landing-mock-user-header"
    >
      <div
        className={
          dense
            ? "w-20 shrink-0 overflow-hidden rounded-xl sm:w-24"
            : "w-full max-w-40 shrink-0 overflow-hidden rounded-2xl sm:w-36 lg:w-40"
        }
      >
        <img
          src={user.avatarUrl}
          alt=""
          className={
            dense
              ? "border-base-300 aspect-square size-full border object-cover"
              : "border-base-300 aspect-square size-full border object-cover sm:aspect-auto sm:min-h-36"
          }
          data-test="landing-mock-avatar"
        />
      </div>

      <div
        className={
          dense
            ? "flex min-w-0 flex-1 flex-col justify-center gap-2 sm:flex-row sm:items-center sm:gap-5"
            : "flex w-full min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-6"
        }
      >
        <div
          className={
            dense
              ? "min-w-0 flex-1 space-y-1"
              : "flex min-w-0 flex-1 flex-col items-center space-y-2.5 text-center sm:items-start sm:text-left"
          }
        >
          <div className="space-y-1">
            <h2
              className={
                dense
                  ? "text-lg font-bold tracking-tight sm:text-xl"
                  : "text-xl font-bold tracking-tight sm:text-2xl"
              }
            >
              {user.name}
            </h2>
            <p className="text-base-content/55 inline-flex items-center gap-1.5 text-xs sm:text-sm">
              <FaGithub className="size-3 opacity-60" aria-hidden />@{user.login}
            </p>
            <p className="text-base-content/75 line-clamp-2 max-w-md text-sm leading-5">
              {user.bio}
            </p>
            {dense ? null : (
              <p className="text-base-content/45 text-xs sm:text-sm">{user.joinedLabel}</p>
            )}
          </div>

          <ul
            className={
              dense
                ? "text-base-content/70 flex flex-wrap gap-x-3 gap-y-1 text-xs"
                : "text-base-content/70 flex flex-col items-center gap-1 text-sm sm:items-start"
            }
          >
            <li className="inline-flex items-center gap-1.5">
              <Building2 className="text-base-content/40 size-3.5" aria-hidden />
              {user.company}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="text-base-content/40 size-3.5" aria-hidden />
              {user.location}
            </li>
          </ul>
        </div>

        <div
          className={
            dense
              ? "hidden min-w-0 shrink-0 flex-col gap-2 sm:flex"
              : "flex w-full min-w-0 flex-col items-center gap-3 sm:w-auto sm:max-w-xs sm:items-start sm:justify-center"
          }
        >
          <div className="space-y-1.5">
            <p className="text-base-content/45 text-[10px] font-medium tracking-wide uppercase">
              Links
            </p>
            <ul className="flex flex-wrap gap-1" aria-hidden>
              <li className="text-base-content/55 bg-base-300/40 inline-flex size-8 items-center justify-center rounded-lg">
                <Mail className="size-3.5" />
              </li>
              <li className="text-base-content/55 bg-base-300/40 inline-flex size-8 items-center justify-center rounded-lg">
                <Globe className="size-3.5" />
              </li>
            </ul>
            {dense ? null : (
              <p className="text-base-content/45 text-xs">
                {user.email} · {user.websiteLabel}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-base-content/45 text-[10px] font-medium tracking-wide uppercase">
              Languages
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {user.languages.map((lang) => (
                <li
                  key={lang.id}
                  className="border-base-300 bg-base-100/70 text-base-content/75 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: lang.color }}
                    aria-hidden
                  />
                  {lang.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
