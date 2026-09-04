export type CurvedSection = {
  id: string;
  label: string;
  body?: string;
  eyebrow?: string;
  background: string;
  foreground: string;
};

export type CurvedNumberedSectionsProps = {
  sections: readonly CurvedSection[];
  className?: string;
  dataTest?: string;
};
