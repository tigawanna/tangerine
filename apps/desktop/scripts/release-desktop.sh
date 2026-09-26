#!/usr/bin/env bash
# Tag + push a desktop release. CI builds binaries and attaches them to a GitHub Release.
#
# Usage:
#   pnpm --filter desktop release          # next patch after latest desktop-v* tag
#   pnpm --filter desktop release 0.2.0    # explicit version (desktop-v0.2.0)
#   pnpm --filter desktop release --dry-run
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

dry_run=0
version=""

usage() {
  cat <<'EOF'
Tag + push a desktop release. CI builds binaries and attaches them to a GitHub Release.

Usage:
  pnpm --filter desktop release          # next patch after latest desktop-v* tag
  pnpm --filter desktop release 0.2.0    # explicit version (desktop-v0.2.0)
  pnpm --filter desktop release --dry-run
EOF
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown flag: $arg" >&2
      exit 1
      ;;
    *)
      if [[ -n "$version" ]]; then
        echo "Unexpected extra argument: $arg" >&2
        exit 1
      fi
      version="$arg"
      ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository." >&2
  exit 1
fi

if [[ -z "$version" ]]; then
  latest="$(git tag -l 'desktop-v*' --sort=-v:refname | head -n1 || true)"
  if [[ -z "$latest" ]]; then
    version="0.1.0"
  else
    semver="${latest#desktop-v}"
    IFS=. read -r major minor patch <<<"$semver"
    if [[ -z "${major:-}" || -z "${minor:-}" || -z "${patch:-}" ]]; then
      echo "Could not parse latest tag '$latest' — pass an explicit version." >&2
      exit 1
    fi
    version="${major}.${minor}.$((patch + 1))"
  fi
fi

version="${version#v}"
version="${version#desktop-v}"

if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid version '$version' (expected semver like 0.1.0)." >&2
  exit 1
fi

tag="desktop-v${version}"

if git rev-parse "$tag" >/dev/null 2>&1; then
  echo "Tag $tag already exists." >&2
  exit 1
fi

if [[ "$dry_run" -eq 0 && -n "$(git status --porcelain)" ]]; then
  echo "Working tree is dirty. Commit or stash before releasing." >&2
  git status --short >&2
  exit 1
fi

branch="$(git branch --show-current)"
remote_ref="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
echo "Branch:  ${branch:-detached}"
echo "Tag:     $tag"
echo "Commit:  $(git rev-parse --short HEAD)"
if [[ -n "$remote_ref" ]]; then
  echo "Upstream: $remote_ref"
fi

if [[ "$dry_run" -eq 1 ]]; then
  echo "Dry run — no tag created or pushed."
  exit 0
fi

git tag -a "$tag" -m "Desktop release ${version}"
git push origin "$tag"

repo_slug="$(git remote get-url origin | sed -E 's#^(git@|https://)([^/:]+)[:/]##' | sed 's#\.git$##')"
echo
echo "Pushed $tag. GitHub Actions will build and publish:"
echo "  https://github.com/${repo_slug}/actions"
echo "Release (once green):"
echo "  https://github.com/${repo_slug}/releases/tag/${tag}"
