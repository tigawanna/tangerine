export const siteConfig = {
  name: "Dennis Waweru",
  title: "Dennis Kinuthia",
  /** Public brand / handle shown in nav, footer, and SEO keywords. */
  brand: "tigawanna",
  role: "Full Stack TypeScript Developer",
  description:
    "Crafting exceptional web experiences with full-stack TypeScript. Based in Nairobi, Kenya.",
  locationLabel: "Based in",
  location: "Nairobi",
  contactHeading: "Let's build the next system without the ghosts.",
  /** Short footer blurb under the brand wordmark. */
  tagline:
    "Full-stack TypeScript, warm interfaces, strict systems, and occasionally a creature feature.",
  contactBlurb:
    "Open to projects, collaborations, and useful conversations about TypeScript, product architecture, and web systems.",
  navItems: [
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Projects", href: "#projects" },
    { label: "Articles", href: "#articles" },
    { label: "Infodiet", href: "#infodiet" },
    { label: "Journal", href: "#journal" },
    { label: "Contact", href: "#contact" },
  ],
  links: {
    github: "https://github.com/tigawanna",
    linkedin: "https://linkedin.com/in/dennis-kinuthia-waweru",
    devto: "https://dev.to/tigawanna",
    email: "denniskinuthiawaweru@gmail.com",
    emailTo: "mailto:denniskinuthiawaweru@gmail.com",
    twitter: "https://twitter.com/tigawanna",
    website: "https://tigawanna-portfolio.vercel.app",
  },
  techSkills: [
    "React & Next.js",
    "TypeScript",
    "TanStack Start",
    "GraphQL",
    "Node.js",
    "Tailwind CSS",
    "React Native",
    "REST APIs",
    "Prisma & Drizzle",
    "Authentication",
    "State Management",
    "Testing",
    "CI/CD",
    "Performance",
    "Accessibility",
  ],
  assets: {
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    icon: "/icon.png",
    ogImage: "/opengraph-image.jpg",
    ogImageAlt: "image of dennis kinuthia, a fullstack software developer",
  },
} as const;
