import type { TechChoice } from "./types";

export type InfoCard = {
  tag: string;
  title: string;
  body: string;
};

export type InfoDietSourceKind = "podcast" | "blog";

export type InfoDietSource = {
  id: string;
  name: string;
  description: string;
  href: string;
  kind: InfoDietSourceKind;
};

export const infoDietSources = [
  {
    id: "front-end-fire",
    name: "Front-End Fire",
    description: "Weekly front-end news with Jack Herrington, Paige Niedringhaus, and TJ VanToll.",
    href: "https://front-end-fire.com/",
    kind: "podcast",
  },
  {
    id: "corecursive",
    name: "CoRecursive",
    description: "Long-form interviews with the people behind well-known software.",
    href: "https://corecursive.com/",
    kind: "podcast",
  },
  {
    id: "software-unscripted",
    name: "Software Unscripted",
    description: "Casual conversations about code with Richard Feldman.",
    href: "https://shows.acast.com/software-unscripted",
    kind: "podcast",
  },
  {
    id: "react-native-radio",
    name: "React Native Radio",
    description: "Exploring React Native together, from Infinite Red.",
    href: "https://www.reactnativeradio.com/",
    kind: "podcast",
  },
  {
    id: "syntax-fm",
    name: "Syntax FM",
    description: "Tasty web development treats with Wes Bos and Scott Tolinski.",
    href: "https://syntax.fm/",
    kind: "podcast",
  },
  {
    id: "typescript-fm",
    name: "TypeScript FM",
    description: "Weekly TypeScript news and deep dives with Kamran Ayub and Erik Onarheim.",
    href: "https://typescript.fm/",
    kind: "podcast",
  },
  {
    id: "podrocket",
    name: "PodRocket",
    description: "Frontend interviews and industry news from the LogRocket team.",
    href: "https://podrocket.logrocket.com/",
    kind: "podcast",
  },
  {
    id: "logrocket-blog",
    name: "LogRocket Blog",
    description: "Frontend engineering articles, tutorials, and industry roundups.",
    href: "https://blog.logrocket.com/",
    kind: "blog",
  },
] as const satisfies readonly InfoDietSource[];

export type StackCubeFace = {
  label: string;
  techs: readonly string[];
};

export const stackCubeFaces = [
  {
    label: "Web",
    techs: ["React", "Next.js", "TanStack", "Tailwind CSS", "TypeScript"],
  },
  {
    label: "Mobile",
    techs: ["React Native", "Expo", "Capacitor", "PWA", "TypeScript"],
  },
  {
    label: "AI",
    techs: ["RAG", "Chatbots", "Workflows", "Agents"],
  },
  {
    label: "Backend",
    techs: ["Node.js", "Docker", "AWS", "GCP", "Cloudflare", "Linux Servers", "Supabase"],
  },
] as const satisfies readonly StackCubeFace[];

export const howIWorkCards = [
  {
    tag: "Ownership",
    title: "End-to-end project ownership",
    body: "Architecture through deployment and the work after launch. I stay accountable for the entire lifecycle, not just my part.",
  },
  {
    tag: "Architecture",
    title: "System design & direction",
    body: "Data modeling, stack decisions, and architecture reviews before you commit. I help teams choose paths they can live with.",
  },
  {
    tag: "Teams",
    title: "Team multiplier",
    body: "Led frontend teams, mentored juniors, tightened CI, and left codebases easier to onboard than I found them.",
  },
  {
    tag: "Engagement",
    title: "Any team shape, any model",
    body: "Full-time, contract, and freelance across remote US teams, hybrid setups, and in-person. Forward-deployed too. Embedded inside your org to build the integrations and upgrades your stack needs from the inside.",
  },
  {
    tag: "Quality",
    title: "Maintainable by default",
    body: "Performance-minded implementations, sensible tests, and code review habits that catch issues before they ship.",
  },
  {
    tag: "Partnership",
    title: "Cross-functional collaborator",
    body: "Comfortable across product, design, and engineering, connecting needs across teams so the work actually lands.",
  },
  {
    tag: "Open source",
    title: "Contributor & user",
    body: "I enjoy open source and give back where I can with fixes, docs, and contributions to core tools and libraries.",
  },
] as const satisfies readonly InfoCard[];

export const howIWorkSummary =
  "I own projects from architecture through deployment, designing systems teams can live with and shipping maintainable, performance-minded code. Full-time, contract, or freelance, remote, hybrid, or in-person. Along the way I mentor teams, collaborate across product and design, and give back to open source.";

export const howIWorkSections = [
  {
    id: "ownership",
    tag: "Ownership",
    title: "End-to-end project ownership",
    body: "From architecture through deployment and the work after launch. I stay accountable for the entire lifecycle, not just my part.",
    background: "var(--color-landing-face-1)",
    foreground: "var(--color-landing-cream-bg)",
  },
  {
    id: "architecture",
    tag: "Architecture",
    title: "System design & direction",
    body: "Data modeling, stack decisions, and reviews before you commit. I help teams choose paths they can live with.",
    background: "var(--color-landing-face-2)",
    foreground: "var(--color-landing-cream-bg)",
  },
  {
    id: "teams",
    tag: "Teams",
    title: "Team multiplier",
    body: "I lead, mentor, and collaborate across product, design, and engineering, translating constraints so the work actually lands.",
    background: "var(--color-landing-face-3)",
    foreground: "var(--color-landing-cream-bg)",
  },
  {
    id: "engagement",
    tag: "Engagement",
    title: "Any team shape, any model",
    body: "Full-time, contract, and freelance across remote US teams, hybrid setups, and in-person. Forward-deployed too. Embedded inside your org to build the integrations and upgrades your stack needs from the inside.",
    background: "var(--color-landing-face-1)",
    foreground: "var(--color-landing-cream-bg)",
  },
  {
    id: "open-source",
    tag: "Open source",
    title: "Contributor & builder",
    body: "Maintainable code by default, open source contributions, and tools built on the fly: CLIs, Chrome extensions, web apps, and MCPs that remove friction and multiply what a team can ship.",
    background: "var(--color-landing-face-4)",
    foreground: "var(--color-landing-cream-bg)",
  },
] as const;

export const techChoices = [
  {
    id: "typescript",
    name: "TypeScript",
    shortName: "TS",
    category: "Language",
    position: "Executable contracts",
    summary:
      "TypeScript is the discipline layer. I use it to make intent explicit before bugs get a chance to become runtime surprises.",
    reason:
      "Strict types keep API boundaries honest, make refactors less dramatic, and let the editor become a design tool for the system instead of a spellchecker.",
    strengths: ["Strict contracts", "Refactors", "DX", "API safety"],
  },
  {
    id: "zod",
    name: "Zod",
    shortName: "Zod",
    category: "Validation",
    position: "Runtime contracts",
    summary:
      "Zod is how I validate at the boundaries: API payloads, form input, env vars, and anything that crosses from unknown into application code.",
    reason:
      "Schemas double as TypeScript types, fail fast with clear errors, and keep untrusted data from silently becoming trusted state.",
    strengths: ["Runtime validation", "Type inference", "Form schemas", "Env parsing"],
  },
  {
    id: "react",
    name: "React",
    shortName: "React",
    category: "UI runtime",
    position: "Composable interface core",
    summary:
      "React is still my default for interfaces. It may not beat Solid on raw performance or Svelte on weight, but the declarative model, where UI is a function of state, keeps holding its own when products get complicated.",
    reason:
      "Early returns, conditional branches, and ordinary control flow make it easy to shape complex UI around complex state without fighting the framework, and the ecosystem still has no real peer.",
    strengths: ["Declarative UI", "State-driven rendering", "Control flow", "Ecosystem"],
  },
  {
    id: "next",
    name: "Next.js",
    shortName: "Next",
    category: "React framework",
    position: "Server-first default",
    summary:
      "Next.js is the React meta-framework I trust most for server-side rendering, with exclusive patterns like PPR, best-in-class static and incremental rendering, and the widest RSC adoption in production.",
    reason:
      "It has been around longer than the alternatives, ships the maturest server rendering story, and carries enough industry gravity and ecosystem depth that teams rarely need to justify the choice.",
    strengths: ["PPR", "SSG & ISR", "RSC", "Ecosystem maturity"],
  },
  {
    id: "tanstack",
    name: "TanStack",
    shortName: "TanStack",
    category: "React stack",
    position: "Cohesive primitives",
    summary:
      "TanStack is the stack I reach for when I want the React ecosystem without stitching together half a dozen libraries: server state, typed routing, typed forms, SSR when you need it, and optimistic updates, all while staying heavily client- and SPA-first like the web apps I build most often.",
    reason:
      "The primitives are designed to play well together, keep application code clean, and push toward performance-minded patterns without forcing a server-first model on products that are still mostly SPA at heart.",
    strengths: [
      "TanStack Query",
      "TanStack Router",
      "TanStack Form",
      "TanStack Start",
      "TanStack DB",
    ],
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    shortName: "Tailwind",
    category: "Styling",
    position: "Fast visual systems",
    summary:
      "Tailwind helps me move quickly without inventing one-off CSS names for every small layout decision.",
    reason:
      "The utility model keeps styling close to the markup, while design tokens and shared components still give the system enough structure to stay consistent.",
    strengths: ["Tokens", "Responsive UI", "Velocity", "Consistency"],
  },
  {
    id: "nodejs",
    name: "Node.js",
    shortName: "Node",
    category: "Runtime",
    position: "Server-side JavaScript",
    summary:
      "Node.js is the default runtime when I need servers, APIs, scripts, and tooling in the same language as the frontend.",
    reason:
      "Mature ecosystem, wide hosting support, and enough flexibility to run everything from compact APIs to long-running services without changing stacks.",
    strengths: ["APIs", "Tooling", "npm ecosystem", "TypeScript-native"],
  },
  {
    id: "drizzle",
    name: "Drizzle ORM",
    shortName: "Drizzle",
    category: "Data layer",
    position: "SQL with types",
    summary:
      "Drizzle is my go-to for talking to databases on the server, on mobile, or in embedded web setups, anywhere you want SQL to stay visible instead of buried under a heavy ORM.",
    reason:
      "It keeps queries explicit and typed, works cleanly across runtimes, and makes schema, migrations, and data access feel lightweight without sacrificing control.",
    strengths: ["Typed schema", "Cross-runtime", "Migrations", "SQL-first"],
  },
  {
    id: "vitest",
    name: "Vitest",
    shortName: "Vitest",
    category: "Testing",
    position: "Fast test runner",
    summary:
      "Vitest is my default test runner when I want fast feedback loops without a separate Jest configuration tax.",
    reason:
      "It shares the Vite toolchain, runs TypeScript natively, handles unit and integration tests well, and feels natural in modern React and Node projects.",
    strengths: ["Vite-native", "TypeScript", "Watch mode", "Component tests"],
  },
  {
    id: "expo",
    name: "Expo",
    shortName: "Expo",
    category: "Mobile",
    position: "React-native delivery",
    summary:
      "Expo is how I ship mobile when I want React product thinking on iOS and Android without drowning in native toolchain setup.",
    reason:
      "It wraps React Native with a sane default stack (routing, builds, OTA updates, and device APIs) so teams can focus on the product instead of the platform plumbing.",
    strengths: ["Expo Router", "EAS Build", "OTA updates", "Dev client"],
  },
] as const satisfies readonly TechChoice[];

const seoKeywordTerms = [
  ...stackCubeFaces.flatMap((face) => [face.label, ...face.techs]),
  ...techChoices.flatMap((tech) => [tech.name, tech.category, tech.position, ...tech.strengths]),
  ...howIWorkCards.flatMap((card) => [card.tag, card.title]),
  ...howIWorkSections.map((section) => section.tag),
  "full-stack developer",
  "fullstack developer",
  "software engineer",
  "TypeScript developer",
  "web developer",
  "mobile developer",
  "full-time",
  "contract",
  "freelance",
  "remote developer",
  "remote US teams",
  "hybrid teams",
  "in-person teams",
  "forward deployed",
  "embedded engineer",
  "system design",
  "software architecture",
  "end-to-end ownership",
  "team lead",
  "mentorship",
  "open source",
  "CI/CD",
  "performance",
  "accessibility",
  "Nairobi",
  "Kenya",
  "tigawanna",
  "Dennis Waweru",
  "Dennis Kinuthia",
];

function uniqueSeoKeywords(terms: readonly string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const term of terms) {
    const trimmed = term.trim();
    const normalized = trimmed.toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(trimmed);
  }

  return result.join(", ");
}

export const siteSeoKeywords = uniqueSeoKeywords(seoKeywordTerms);

export const siteSeoDescription = `${howIWorkSummary} Stack: React, Next.js, TanStack, TypeScript, React Native, Expo, Node.js, Drizzle, AWS, GCP, Cloudflare, and Supabase. Forward-deployed integrations and upgrades. Based in Nairobi, Kenya.`;

export const siteSeoTitle = "Dennis Waweru | Full Stack TypeScript Developer";

export const siteSeoOgImageAlt =
  "Dennis Waweru, full-stack TypeScript developer. React, Next.js, TanStack, and React Native. Remote, hybrid, and in-person across full-time, contract, freelance, and forward-deployed engagements.";
