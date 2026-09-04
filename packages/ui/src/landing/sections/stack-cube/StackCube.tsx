import { StackCubeDesktop } from "./StackCubeDesktop";
import { StackCubeMobile } from "./StackCubeMobile";

export function StackCube() {
  return (
    <section data-test="stack-cube" aria-labelledby="stack-cube-heading">
      <h2 id="stack-cube-heading" className="sr-only">
        What I build with
      </h2>

      <div className="lg:hidden">
        <StackCubeMobile />
      </div>

      <div className="hidden lg:block">
        <StackCubeDesktop />
      </div>
    </section>
  );
}
