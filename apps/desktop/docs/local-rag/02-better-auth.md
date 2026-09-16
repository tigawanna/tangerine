# Chapter 2: Better Auth

[Series index](./README.md) · Prev: [Chapter 1](./01-deno-desktop-setup.md) · Next: [Chapter 3: Worker engine](./03-worker-engine.md)

## Goal

Sign the desktop app into GitHub so we can read starred repos (and stay inside API quotas with a real user token).

## Outline (TODO)

- System-browser OAuth vs baking secrets into the desktop binary
- Better Auth on a small API, desktop as the Electron-style client
- PKCE / loopback return path on Deno Desktop
- Session storage under the desktop config dir
- What the GitHub token is for: stars, README/metadata pulls for the RAG corpus
- Gotchas: trusted origins, env split (`VITE_API_URL` vs app URL), restart after preload changes

## Notes

_Write the narrative here. Point at `docs/auth.md` where it already covers the flow._
