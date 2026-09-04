import { AppConfig } from "../../config/system";
import { ExternalLink, Layers, ShieldCheck, Workflow } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { LandingSection, OrganicDivider, ScrollReveal, SectionEyebrow } from "../../primitives";

export function LandingShowcase() {
  return (
    <LandingSection id="about" tone="deep" className="text-base-content">
      <OrganicDivider tone="deep" />
      <div className="grain-overlay" />

      <div className="container relative z-10">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <ScrollReveal>
            <SectionEyebrow>About the build style</SectionEyebrow>
            <h2 className="landing-section-heading">
              Calm interfaces, strict types, useful systems.
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-8 text-base-content/70">
              <p>
                I like products that feel intentional from the first paint to the last database
                write. Most of my work sits in the full-stack TypeScript lane: React, TanStack,
                workers, APIs, auth, data modeling, and deployment.
              </p>
              <p>
                The portfolio is being rebuilt around that same idea: a fast normal page first, then
                a more playful opt-in scroll story for people who want the weird bit.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={AppConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline gap-2"
              >
                GitHub
                <FaGithub />
              </a>
              <a
                href={AppConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary gap-2"
              >
                LinkedIn
                <FaLinkedin />
              </a>
            </div>
          </ScrollReveal>

          <div className="grid gap-5">
            {[
              {
                title: "Product mechanics",
                body: "Auth, admin tools, project catalogs, contact flows, and the service layer that keeps UI honest.",
                icon: Workflow,
              },
              {
                title: "Typed surfaces",
                body: "End-to-end contracts, schemas, query options, server functions, and client code that does not hide uncertainty.",
                icon: ShieldCheck,
              },
              {
                title: "Interface systems",
                body: "Reusable sections, tuned typography, accessible components, and motion that supports the story.",
                icon: Layers,
              },
            ].map((item, index) => {
              const Icon = item.icon;

              return (
                <ScrollReveal key={item.title} delay={index === 0 ? "short" : "medium"}>
                  <article className="group rounded-none border border-base-content/10 bg-base-content/4.5 p-6 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <ExternalLink className="size-4 text-base-content/25 transition-colors group-hover:text-primary" />
                    </div>
                    <h3 className="font-serif text-3xl text-base-content">{item.title}</h3>
                    <p className="mt-3 leading-7 text-base-content/60">{item.body}</p>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
