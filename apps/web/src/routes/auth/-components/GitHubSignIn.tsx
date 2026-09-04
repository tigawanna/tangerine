import { authClient, authClientErrorMessage } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { toast } from "sonner";

type GitHubSignInProps = {
  callbackURL: string;
};

export function GitHubSignIn({ callbackURL }: GitHubSignInProps) {
  const router = useRouter();
  const {
    mutate: handleSignIn,
    isPending
  } = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL,
      });
      if (result.error) {
        throw new Error(authClientErrorMessage(result.error) ?? "GitHub sign-in failed.");
      }
      return result.data;
    },
    onSuccess: () => {
      router.navigate({ to: "/" });
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message);
    },
  });
  return (
    <div className="space-y-3">
      <button
        type="button"
        className="btn btn-primary w-full"
        data-test="auth-github-sign-in"
        disabled={isPending}
        onClick={() => {
          void handleSignIn();
        }}>
        <Github className="size-4" aria-hidden />
        {isPending ? "Redirecting…" : "Continue with GitHub"}
      </button>
    </div>
  );
}
