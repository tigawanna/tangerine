import { getSession } from "@/data-access-layer/auth/auth.functions";
import { AuthSignInScreen } from "@/routes/auth/-components/AuthSignInScreen";
import { AppConfig } from "@/utils/system";
import { parseOptionalGithubScopes } from "@repo/auth";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const authSearchSchema = z.object({
  returnTo: z.string().optional().default("/viewer"),
  /** Comma-separated optional scopes to pre-check (e.g. `user:follow,delete_repo`). */
  optScopes: z.string().optional(),
  /** Better Auth Electron PKCE / client params (pass through to `signIn.social`). */
  client_id: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
});

export const Route = createFileRoute("/auth/")({
  validateSearch: (search) => authSearchSchema.parse(search),
  beforeLoad: async ({ search }) => {
    // Electron deep-link flow — stay on sign-in even if a web session exists.
    if (search.state && search.code_challenge) return;

    const session = await getSession();
    if (session) {
      throw redirect({ href: search.returnTo });
    }
  },
  component: AuthPage,
  head: () => ({
    meta: [{ title: `Sign in | ${AppConfig.name}` }],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap",
      },
    ],
  }),
});

function AuthPage() {
  const { returnTo, optScopes, client_id, state, code_challenge } = Route.useSearch();
  const electronQuery =
    client_id || state || code_challenge
      ? { client_id, state, code_challenge }
      : undefined;

  return (
    <AuthSignInScreen
      returnTo={returnTo}
      initialOptionalScopes={parseOptionalGithubScopes(optScopes)}
      electronQuery={electronQuery}
    />
  );
}
