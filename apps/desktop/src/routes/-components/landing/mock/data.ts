/** Static demo content for landing product previews — tweak freely. */

export type LandingMockLanguage = {
  id: string;
  name: string;
  color: string;
};

export type LandingMockRepo = {
  id: string;
  name: string;
  ownerLogin: string;
  description: string;
  isPrivate?: boolean;
  isFork?: boolean;
  stargazerCount: number;
  forkCount: number;
  branch: string;
  pushedLabel: string;
  disk: string;
  languages: LandingMockLanguage[];
  /** CSS gradient stops for the card cover (no external images). */
  cover: string;
};

export type LandingMockUser = {
  name: string;
  login: string;
  email: string;
  bio: string;
  company: string;
  location: string;
  joinedLabel: string;
  websiteLabel: string;
  languages: LandingMockLanguage[];
  /** Deterministic avatar from DiceBear — no auth / Relay required. */
  avatarUrl: string;
};

export const landingMockUser = {
  name: "John Doe",
  login: "johndoe",
  email: "john@example.com",
  bio: "Building tools that make GitHub feel local-first.",
  company: "Acme Labs",
  location: "Austin, TX",
  joinedLabel: "Joined 4 years ago",
  websiteLabel: "johndoe.dev",
  avatarUrl:
    "https://api.dicebear.com/9.x/notionists/svg?seed=JohnDoe&backgroundColor=f7b538",
  languages: [
    { id: "ts", name: "TypeScript", color: "#3178c6" },
    { id: "rs", name: "Rust", color: "#dea584" },
    { id: "py", name: "Python", color: "#3572A5" },
  ],
} as const satisfies LandingMockUser;

export const landingMockRepos = [
  {
    id: "1",
    name: "harbor-cli",
    ownerLogin: "johndoe",
    description: "Ship local-first GitHub workflows from the terminal.",
    stargazerCount: 1284,
    forkCount: 86,
    branch: "main",
    pushedLabel: "2 days ago",
    disk: "4.2 MB",
    languages: [
      { id: "ts", name: "TypeScript", color: "#3178c6" },
      { id: "go", name: "Go", color: "#00ADD8" },
    ],
    cover: "linear-gradient(135deg, #1e3a5f 0%, #3178c6 55%, #7dd3fc 100%)",
  },
  {
    id: "2",
    name: "pulse-board",
    ownerLogin: "johndoe",
    description: "A quieter dashboard for stars, repos, and follow graphs.",
    isPrivate: true,
    stargazerCount: 412,
    forkCount: 19,
    branch: "main",
    pushedLabel: "5 hours ago",
    disk: "1.8 MB",
    languages: [
      { id: "ts", name: "TypeScript", color: "#3178c6" },
      { id: "css", name: "CSS", color: "#563d7c" },
    ],
    cover: "linear-gradient(135deg, #3b1f0f 0%, #c45c1a 50%, #f7b538 100%)",
  },
  {
    id: "3",
    name: "ember-kit",
    ownerLogin: "johndoe",
    description: "Shared UI primitives for warm, low-chrome developer apps.",
    isFork: true,
    stargazerCount: 96,
    forkCount: 12,
    branch: "develop",
    pushedLabel: "last week",
    disk: "890 KB",
    languages: [
      { id: "ts", name: "TypeScript", color: "#3178c6" },
      { id: "rs", name: "Rust", color: "#dea584" },
    ],
    cover: "linear-gradient(135deg, #1a2e1a 0%, #3f6212 45%, #a3e635 100%)",
  },
] as const satisfies readonly LandingMockRepo[];

export const landingMockStarredRepos = [
  {
    id: "s1",
    name: "tanstack-router",
    ownerLogin: "TanStack",
    description: "Type-safe routing for React and friends.",
    stargazerCount: 11200,
    forkCount: 840,
    branch: "main",
    pushedLabel: "yesterday",
    disk: "12.1 MB",
    languages: [{ id: "ts", name: "TypeScript", color: "#3178c6" }],
    cover: "linear-gradient(135deg, #0f172a 0%, #6366f1 55%, #c4b5fd 100%)",
  },
  {
    id: "s2",
    name: "relay",
    ownerLogin: "facebook",
    description: "A JavaScript framework for building data-driven apps.",
    stargazerCount: 18500,
    forkCount: 1900,
    branch: "main",
    pushedLabel: "3 days ago",
    disk: "28.4 MB",
    languages: [
      { id: "js", name: "JavaScript", color: "#f1e05a" },
      { id: "flow", name: "Flow", color: "#e8bd36" },
    ],
    cover: "linear-gradient(135deg, #0c1a2e 0%, #1877f2 50%, #93c5fd 100%)",
  },
  {
    id: "s3",
    name: "zed",
    ownerLogin: "zed-industries",
    description: "Code at the speed of thought.",
    stargazerCount: 62000,
    forkCount: 4300,
    branch: "main",
    pushedLabel: "4 hours ago",
    disk: "210 MB",
    languages: [{ id: "rs", name: "Rust", color: "#dea584" }],
    cover: "linear-gradient(135deg, #111111 0%, #525252 40%, #e5e5e5 100%)",
  },
] as const satisfies readonly LandingMockRepo[];

export type LandingMockPerson = {
  id: string;
  name: string;
  login: string;
  bio: string;
  avatarUrl: string;
  action: "Follow back" | "Unfollow" | "Follow" | "Following";
};

export const landingMockPeople = [
  {
    id: "p1",
    name: "Ada Chen",
    login: "adachen",
    bio: "Building CLI tools and warm UI kits.",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=AdaChen&backgroundColor=c0aede",
    action: "Follow back",
  },
  {
    id: "p2",
    name: "Marcus Lee",
    login: "marcuslee",
    bio: "Relay, routers, and late-night deploys.",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=MarcusLee&backgroundColor=b6e3f4",
    action: "Follow back",
  },
  {
    id: "p3",
    name: "Priya Nair",
    login: "priyanair",
    bio: "Open source maintainer. Stars collector.",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=PriyaNair&backgroundColor=ffd5dc",
    action: "Unfollow",
  },
  {
    id: "p4",
    name: "Jonah Brooks",
    login: "jbrooks",
    bio: "Shipping local-first side projects.",
    avatarUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=JonahBrooks&backgroundColor=d1f4d1",
    action: "Unfollow",
  },
] as const satisfies readonly LandingMockPerson[];

export const landingMockBulkRepos = [
  { id: "b1", name: "old-experiment", selected: true },
  { id: "b2", name: "tmp-scratch", selected: true },
  { id: "b3", name: "legacy-api-v1", selected: true },
  { id: "b4", name: "demo-site-2019", selected: false },
] as const;