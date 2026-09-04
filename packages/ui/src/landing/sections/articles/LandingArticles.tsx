import { siteConfig } from "../../config/site";
import { CreatureEggLowercaseI } from "../../stubs/creature-egg";
import { STATIC_ARTICLES } from "../../data/static";
import { ArrowUpRight } from "lucide-react";
import { ArticleCard } from "../../cards/ArticleCard";
import { LandingSection, OrganicDivider, SectionEyebrow } from "../../primitives";

export function LandingArticles() {
  return (
    <LandingSection
      id="articles"
      tone="darkMid"
      className="text-landing-cream"
      dataTest="landing-articles"
    >
      <OrganicDivider tone="darkMid" />
      <OrganicDivider tone="darkMid" flip />

      <div className="container relative z-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <SectionEyebrow>Articles</SectionEyebrow>
          <h2 className="landing-section-heading">
            Wr
            <CreatureEggLowercaseI />
            ting in public.
          </h2>
          <p className="landing-section-lead">Published on Dev.to.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STATIC_ARTICLES.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={siteConfig.links.devto}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-full border border-primary/30 px-6 py-3 text-sm text-primary transition-colors hover:bg-primary/10"
            data-test="articles-see-more"
          >
            More on Dev.to
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </LandingSection>
  );
}
