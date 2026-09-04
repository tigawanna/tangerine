import { getSession } from "@/data-access-layer/auth/auth.functions";
import { GitHubSignIn } from "@/routes/auth/-components/GitHubSignIn";
import { AppConfig } from "@/utils/system";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const authSearchSchema = z.object({
  returnTo: z.string().optional().default("/repos"),
});

export const Route = createFileRoute("/auth/")({
  validateSearch: (search) => authSearchSchema.parse(search),
  beforeLoad: async ({ search }) => {
    const session = await getSession();
    if (session) {
      throw redirect({ href: search.returnTo });
    }
  },
  component: AuthPage,
  head: () => ({
    meta: [{ title: `Sign in | ${AppConfig.name}` }],
  }),
});

function AuthPage() {
  const { returnTo } = Route.useSearch();
  const Icon = AppConfig.icon;

  return (
    <div className="bg-base-100 text-base-content flex min-h-svh items-center justify-center px-4">
      <main
        className="border-base-300 bg-base-200/40 w-full max-w-md rounded-2xl border p-8"
        data-test="auth-page"
      >
        <div className="bg-primary/10 text-primary mb-6 flex size-12 items-center justify-center rounded-xl">
          <Icon className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-base-content/70 mt-2 text-sm leading-6">
          Continue with GitHub to browse your repositories and stars.
        </p>
        <div className="mt-8">
          <GitHubSignIn callbackURL={returnTo} />
        </div>
      </main>
    </div>
  );
}
