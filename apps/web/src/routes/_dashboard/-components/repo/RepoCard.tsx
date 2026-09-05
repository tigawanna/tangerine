import type { GithubRepoNode } from "@/types/github";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { extractRepoTags } from "@repo/github";
import { ExternalLink, GitFork, Star } from "lucide-react";

interface RepoCardProps {
  repo: GithubRepoNode;
}

/**
 * Compact repository card for the GitHub dashboard grid.
 */
export function RepoCard({ repo }: RepoCardProps) {
  const tags = extractRepoTags(repo).slice(0, 4);

  return (
    <Card className="border-base-300 bg-base-200/40 h-full" data-test={`repo-card-${repo.name}`}>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary inline-flex items-center gap-1.5 transition-colors"
              >
                {repo.name}
                <ExternalLink className="size-3.5 shrink-0 opacity-60" />
              </a>
            </CardTitle>
            {repo.description ? (
              <CardDescription className="mt-2 line-clamp-2">{repo.description}</CardDescription>
            ) : (
              <CardDescription className="mt-2 italic">No description</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-base-content/70 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5" />
            {repo.stargazerCount ?? 0}
          </span>
          {repo.isFork ? (
            <span className="inline-flex items-center gap-1">
              <GitFork className="size-3.5" />
              Fork
            </span>
          ) : null}
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
