import type { HTMLAttributes } from "react";

type EggProps = HTMLAttributes<HTMLSpanElement> & {
  "data-test"?: string;
};

/**
 * Plain-text stand-ins for the portfolio creature-egg triggers.
 * Keeps the shared landing package free of the creature-feature runtime.
 */
export function CreatureEggLowercaseI(props: EggProps) {
  return (
    <span {...props} aria-hidden="true">
      i
    </span>
  );
}

export function CreatureEggCapitalI(props: EggProps) {
  return (
    <span {...props} aria-hidden="true">
      I
    </span>
  );
}

export function CreatureEggTrigger(props: EggProps) {
  return (
    <span {...props} aria-hidden="true">
      .
    </span>
  );
}
