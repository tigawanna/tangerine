import { Link } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { RouteStatusShell } from "./RouteStatusShell";

export function RouterNotFoundComponent() {
  return (
    <RouteStatusShell
      data-test="router-not-found"
      eyebrow="404"
      visual={
        <span
          aria-hidden
          className="bg-landing-surface-raised border-landing-border text-landing-amber inline-flex size-20 items-center justify-center rounded-2xl border"
        >
          <Flag className="size-9" />
        </span>
      }
      title="This page doesn’t exist"
      description="The route you followed isn’t here — or it moved. Head home and try again."
      actions={
        <Link to="/" data-test="router-not-found-home" className="landing-cta-primary">
          Back home
        </Link>
      }
    />
  );
}
