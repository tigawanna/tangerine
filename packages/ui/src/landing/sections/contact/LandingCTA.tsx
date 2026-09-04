import { Button } from "../../stubs/button";
import { unwrapUnknownError } from "../../stubs/errors";
import { AppConfig } from "../../config/system";
import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LandingSection, SectionEyebrow } from "../../primitives";
import { ContactForm } from "./ContactForm";

export function LandingCTA() {
  const [emailCopied, setEmailCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(AppConfig.links.email);
      setEmailCopied(true);
      toast.success("Email copied");
      window.setTimeout(() => setEmailCopied(false), 2000);
    } catch (err: unknown) {
      toast.error("Could not copy email", {
        description: unwrapUnknownError(err).message,
      });
    }
  }

  return (
    <LandingSection id="contact" tone="base" className="relative z-0  text-base-content">
      <div className="container">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
          <div>
            <SectionEyebrow>Contact</SectionEyebrow>
            <h2 className="landing-section-heading">{AppConfig.contactHeading}</h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-base-content/70">
              Open to projects, collaborations, and useful conversations about TypeScript, product
              architecture, and web systems.
            </p>

            <div
              data-test="contact-email-copy"
              className="mt-8 flex flex-wrap items-center gap-3 text-sm text-base-content/75"
            >
              <a
                href={AppConfig.links.emailTo}
                className="inline-flex items-center gap-2 transition-colors hover:text-base-content"
              >
                <Mail className="size-4 shrink-0" />
                <span>{AppConfig.links.email}</span>
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-test="contact-email-copy-button"
                aria-label="Copy email address"
                className="h-auto gap-1.5 px-2 py-1 text-base-content/60 hover:text-base-content"
                onClick={copyEmail}
              >
                {emailCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {emailCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
