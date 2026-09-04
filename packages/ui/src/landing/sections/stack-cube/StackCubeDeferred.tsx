import { stackCubeFaces } from "../../config/info";
import { ClientOnly } from "../../stubs/client-only";
import { CubeVisual } from "./CubeVisual";
import { StackCube } from "./StackCube";

function StackCubeFallback() {
  const firstFace = stackCubeFaces[0];

  return (
    <section data-test="stack-cube" aria-labelledby="stack-cube-heading">
      <h2 id="stack-cube-heading" className="sr-only">
        What I build with
      </h2>

      <div className="landing-void-surface relative px-6 py-14 sm:px-8 sm:py-18">
        <div className="landing-void-glow-top pointer-events-none absolute inset-0" />
        <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
          <p className="font-serif text-3xl font-medium tracking-[-0.03em] text-landing-sage/90 sm:text-4xl">
            What I build with
          </p>
          <div className="mt-8 flex justify-center">
            <div className="cube-stage cube-stage--compact">
              <CubeVisual />
            </div>
          </div>
          {firstFace ? (
            <p className="mt-6 text-center text-sm leading-7 text-landing-sage/70 sm:text-base sm:leading-8">
              {firstFace.techs.join("  ·  ")}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function StackCubeDeferred() {
  return (
    <ClientOnly fallback={<StackCubeFallback />}>
      <StackCube />
    </ClientOnly>
  );
}
