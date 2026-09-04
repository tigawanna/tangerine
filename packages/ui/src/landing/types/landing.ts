import type { ReactNode } from "react";

export type LandingSectionProps = {
  children: ReactNode;
  className?: string;
  dataTest?: string;
  id?: string;
  tone?: "base" | "muted" | "deep" | "olive" | "sage" | "panel" | "panelAlt" | "cream" | "darkMid";
};

export type OrganicDividerProps = {
  className?: string;
  flip?: boolean;
  tone?: "base" | "muted" | "deep" | "olive" | "sage" | "panel" | "panelAlt" | "cream" | "darkMid";
};

export type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: "none" | "short" | "medium" | "long";
  variant?: "default" | "fade";
};
