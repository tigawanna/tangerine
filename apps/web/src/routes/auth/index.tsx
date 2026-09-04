import { getSession } from "@/data-access-layer/auth/auth.functions";
import { AuthSignInScreen } from "@/routes/auth/-components/AuthSignInScreen";
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
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&display=swap",
      },
    ],
  }),
});

function AuthPage() {
  const { returnTo } = Route.useSearch();

  return <AuthSignInScreen returnTo={returnTo} />;
}
