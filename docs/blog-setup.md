# Blog Attempt 1 — Goals

This branch (`blog-attapet-1`) holds the first attempt at a first-party blogging system on the TanStack Start site. `main` was reset to the commit before this work because the attempt left the app in a broken state and needs a cleaner redo.

## What we were trying to accomplish

### Core product

- Write and publish blog posts from the site itself (admin/backstage only), instead of only linking out to Dev.to.
- Publish on the site first, then cross-post elsewhere (e.g. Dev.to) with the **canonical URL pointing back** to `https://www.tigawanna.vip/blog/{slug}` so SEO/attention returns to the personal site.
- Unify content under the existing journal system over time (extend `journal_entries` rather than inventing a totally separate CMS), with blogs as a `type: "blog"` path that can later merge with lessons/journal.

### Authoring experience (backstage)

- New backstage section: **Blogs**
  - List all blogs (draft / published filters, search)
  - Create new blog
  - Edit / delete / publish / unpublish
- Blank markdown editor on open (`@uiw/react-md-editor` already in the project) so writing can start immediately.
- AI draft assist (no voice transcription — use the OS/device for that):
  - Modal for inspiration notes + optional reference links
  - OpenRouter **model picker**
  - Generate a first markdown draft into the editor
- Admin detail views should largely match the public post UI, with extra admin actions only.

### Public site

- Public routes:
  - `/blog` — published posts list
  - `/blog/$slug` — individual post
- Server-rendered markdown (existing Showdown + Shiki pipeline).
- Strong SEO: title, description, canonical, Open Graph / Twitter, article tags, structured data.

### Data / infrastructure

- Extend `journal_entries` via **Drizzle schema + generated migration** (no hand-written raw SQL migrations as the primary workflow):
  - `slug`, `status` (`draft` | `published`), `canonical_url`, `tags`, `cover_image`, `published_at`, `meta_description`
  - type value `"blog"`
- Module + DAL layering matching the app conventions (`modules/blog`, `data-access-layer/blog`, backstage query options).
- Enable TanStack Start **static prerendering** (`prerender.enabled` + `crawlLinks`) so blog pages can be generated at build time for SEO/performance (inspired by approaches like [vseventer’s TanStack Start blog write-up](https://www.vseventer.com/blog/implementing-a-simple-blog-with-tanstack-start)).

### Explicitly out of scope for this attempt

- Built-in audio transcription.
- Full Dev.to API cross-post automation (canonical strategy first; posting later).
- Replacing lessons/journal entirely in one shot.

---

## End goal: own the SEO, borrow Dev.to’s audience

Replicate Stanley Masinde’s strategy on this TanStack Start site + Dev.to.

### 1. Publish the full article on the TanStack Start site first

Own the content and SEO. Write and deploy the post on the own domain, e.g.:

`https://www.tigawanna.vip/blog/a-simple-form-for-...`

In TanStack Start, set a proper **canonical URL** in the page `head` so Google treats the site as the original source:

```ts
// In the blog post route (head export / createHead)
head: () => ({
  meta: [
    { title: "Your Post Title" },
    { name: "description", content: "..." },
  ],
  links: [
    { rel: "canonical", href: "https://www.tigawanna.vip/blog/your-post-slug" },
  ],
}),
```

### 2. Cross-post to Dev.to with canonical pointing back

**Manual way (recommended for control):**

1. Copy the full Markdown from the site.
2. Create a new post on Dev.to.
3. In Markdown view, add front-matter at the top:

```yaml
---
title: Your Post Title
published: true
canonical_url: https://www.tigawanna.vip/blog/your-post-slug
---
```

Publish. Dev.to shows a backlink to the original post.

**Automatic RSS import way (later):**

1. Dev.to → Settings → Extensions → “Publishing to DEV Community from RSS”.
2. Add the site’s RSS feed (TanStack Start can expose one via a route).
3. Enable marking the RSS source as canonical so Dev.to auto-sets `canonical_url` to the site.

### 3. Best practices for maximum SEO and reach

- Always publish on the site **first**, then on Dev.to (Google prefers fresh original content).
- On Dev.to, include a short intro like “Originally published on my blog →” + link.
- Optionally add a backlink at the bottom of the own post to the Dev.to version.
- Use consistent titles/slugs across platforms.
- Submit the sitemap in Google Search Console so the canonical version is discovered quickly.

This approach (own site + canonical on Dev.to/Medium) gets Dev.to’s audience and distribution while keeping most SEO value on the TanStack Start website.

---

## Why this branch exists

Attempt 1 shipped a large surface area (schema, routes, AI draft UI, prerender config) and left the app unreliable (including DB/schema drift against the running `local.db`). The code is preserved here for reference; a later attempt should land smaller, testable slices and verify migrations against the actual database the app uses.

## Suggested redo order

1. Schema + migrate the real local DB the app reads, verify journal/lessons still load.
2. Backstage CRUD for blogs with the existing markdown editor (no AI yet).
3. Public `/blog` + `/blog/$slug` + SEO head with **self-canonical**.
4. AI draft modal + model picker.
5. Prerender + sitemap only after public routes are stable.
6. Dev.to cross-post workflow (manual first; RSS/API later) with `canonical_url` always pointing at the site.
