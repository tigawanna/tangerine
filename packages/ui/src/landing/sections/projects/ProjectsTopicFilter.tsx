import { twMerge } from "tailwind-merge";

type ProjectView = "featured" | "recent" | "all";

export function ProjectsTopicFilter({
  topics,
  activeTopic,
  activeView,
  onTopicChange,
  onViewChange,
}: {
  topics: string[];
  activeTopic: string;
  activeView: ProjectView;
  onTopicChange: (topic: string) => void;
  onViewChange: (view: ProjectView) => void;
}) {
  const viewPills: { id: ProjectView; label: string }[] = [
    { id: "featured", label: "Featured" },
    { id: "recent", label: "Recent" },
    { id: "all", label: "All" },
  ];

  const tagSelectValue = activeView === "all" ? activeTopic : "all";

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3"
      data-test="projects-topic-filter"
    >
      <div className="flex flex-wrap gap-2">
        {viewPills.map(({ id, label }) => {
          const isActive =
            id === "all" ? activeView === "all" && activeTopic === "all" : activeView === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onViewChange(id);
                if (id === "all") {
                  onTopicChange("all");
                }
              }}
              className={isActive ? "landing-filter-pill-active" : "landing-filter-pill-inactive"}
            >
              {label}
            </button>
          );
        })}
      </div>

      {topics.length > 0 ? (
        <select
          aria-label="Filter projects by tag"
          data-test="projects-tag-select"
          value={tagSelectValue}
          onChange={(event) => {
            onViewChange("all");
            onTopicChange(event.target.value);
          }}
          className={twMerge(
            "min-w-44 rounded-full border border-landing-cream/10 bg-transparent px-3 py-2 text-sm text-landing-sage/60 shadow-none outline-none",
            "hover:border-landing-cream/20 hover:bg-landing-cream/5 hover:text-landing-sage",
            tagSelectValue !== "all" &&
              "border-landing-cream/25 bg-landing-cream/10 text-landing-cream",
          )}
        >
          <option value="all">All tags</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

export type { ProjectView };
