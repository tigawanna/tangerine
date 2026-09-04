import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_dashboard/stars/")({
  component: StarsPage,
});

function StarsPage() {
  return (
    <div className="space-y-6" data-test="stars-page">
      <section className="space-y-3">
        <p className="text-base-content/60 text-sm tracking-[0.24em] uppercase">Stars</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Starred repositories</h1>
        <p className="text-base-content/70 max-w-2xl text-base leading-7">
          A dedicated view for browsing favorites without leaving the dashboard.
        </p>
      </section>

      <div className="border-base-300 bg-base-200/30 flex flex-col items-start gap-4 rounded-2xl border border-dashed p-8">
        <Star className="text-primary size-8" aria-hidden />
        <div>
          <h2 className="text-xl font-semibold">Coming soon</h2>
          <p className="text-base-content/70 mt-2 max-w-xl text-sm leading-6">
            Starred-repository browsing will land here next so you can scan favorites beside your
            own repos.
          </p>
        </div>
      </div>
    </div>
  );
}
