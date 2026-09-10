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
  /** Better Auth Electron / Deno Desktop PKCE params (pass through to `signIn.social`). */
  client_id: z.string().optional(),
  state: z.string().optional(),
  code_challenge: z.string().optional(),
  /**
   * Deno Desktop loopback callback (`http://127.0.0.1:<port>/callback`).
   * When set, redirect the Electron auth code here instead of the custom scheme
   * (Deno does not deliver open-url events yet — see denoland/deno#36796).
   */
  loopback: z.url().optional(),
});

export const Route = createFileRoute("/auth/")({
  validateSearch: (search) => authSearchSchema.parse(search),
  beforeLoad: async ({ search }) => {
    // Electron / Deno desktop PKCE flow — stay on sign-in even if a web session exists.
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
  const { returnTo, optScopes, client_id, state, code_challenge, loopback } = Route.useSearch();
  const electronQuery =
    client_id || state || code_challenge
      ? { client_id, state, code_challenge }
      : undefined;

  return (
    <AuthSignInScreen
      returnTo={returnTo}
      initialOptionalScopes={parseOptionalGithubScopes(optScopes)}
      electronQuery={electronQuery}
      loopback={loopback}
    />
  );
}
