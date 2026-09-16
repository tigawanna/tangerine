# Chapter 1: Deno Desktop + TanStack Start setup

[Series index](./README.md) · Next: [Chapter 2: Better Auth](./02-better-auth.md)

## Goal

Stand up the desktop shell and define what the local RAG product is before auth, workers, or embeddings.

## Outline (TODO)

- Why Deno Desktop + TanStack Start for a local tool
- Monorepo layout (`apps/desktop`, shared packages, local DB)
- Dev loop: HMR, ports, env basics
- Product objectives
  - Natural-language search over starred repos
  - Local **RAG**: fetch → embed (e.g. Gemma) → **vector DB** → retrieve
  - Stay on-device; no hosted RAG SaaS for the corpus
- Non-goals for v1 (multi-user cloud, realtime collab, etc.)
- How later chapters fit: auth → paced indexing → live progress → query UI

## Notes

_Write the narrative here._
