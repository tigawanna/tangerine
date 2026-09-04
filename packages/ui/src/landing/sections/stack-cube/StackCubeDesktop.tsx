import { stackCubeFaces } from "../../config/info";
import { CubeVisual } from "./CubeVisual";

const FACE_COUNT = stackCubeFaces.length;

/**
 * Cover-range slice for a face panel. Slight overlap softens crossfades.
 */
function faceCoverRange(index: number): string {
  const start = Math.max(0, (index / FACE_COUNT) * 100 - 1);
  const end = Math.min(100, ((index + 1) / FACE_COUNT) * 100 + 3);
  return `cover ${start}% cover ${end}%`;
}

/**
 * Cover-range for a tech row, staggered slightly after the face opens.
 */
function techCoverRange(faceIndex: number, techIndex: number): string {
  const faceStart = Math.max(0, (faceIndex / FACE_COUNT) * 100 - 1);
  const faceEnd = Math.min(100, ((faceIndex + 1) / FACE_COUNT) * 100 + 3);
  const start = Math.min(faceEnd - 4, faceStart + 2 + techIndex * 1.4);
  return `cover ${start}% cover ${faceEnd}%`;
}

export function StackCubeDesktop() {
  return (
    <div
      data-test="stack-cube-desktop"
      className="stack-cube-desktop landing-void-surface relative"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="landing-void-glow-center pointer-events-none absolute inset-0" />

        <div className="relative z-10 grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-28 px-6 xl:gap-36">
          <div className="relative min-h-[280px]">
            {stackCubeFaces.map((face, index) => (
              <div
                key={face.label}
                data-label-group
                data-face={index}
                className="stack-cube-label absolute inset-0 flex flex-col justify-center"
                style={{ animationRange: faceCoverRange(index) }}
              >
                <p className="text-xs tracking-[0.38em] text-landing-sage/40 uppercase">
                  I build for
                </p>
                <h3 className="mt-3 font-serif text-6xl font-medium tracking-[-0.03em] lg:text-7xl">
                  {face.label}
                </h3>
                <div className="mt-4 h-px w-16 bg-landing-sage/20" />
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center px-10 lg:px-14">
            <div className="cube-stage cube-stage--centered">
              <CubeVisual />
            </div>
          </div>

          <div className="relative min-h-[280px] pl-8 lg:pl-16 xl:pl-24">
            {stackCubeFaces.map((face, index) => (
              <div
                key={face.label}
                data-tech-group
                data-face={index}
                className="absolute inset-0 flex flex-col justify-center gap-2.5"
              >
                {face.techs.map((tech, techIndex) => (
                  <span
                    key={tech}
                    data-tech
                    className="stack-cube-tech block text-base leading-snug tracking-wide text-landing-sage/70 lg:text-lg"
                    style={{ animationRange: techCoverRange(index, techIndex) }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute right-0 bottom-10 left-0 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-landing-sage/30" aria-hidden="true">
            {stackCubeFaces.map((face, index) => (
              <div key={face.label} className="flex items-center gap-2">
                {index > 0 && <div className="h-px w-3 bg-current" />}
                <span className="text-[9px] tracking-[0.25em] uppercase">{face.label}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] tracking-[0.3em] text-landing-sage/25 uppercase">
            Scroll to rotate
          </p>
        </div>
      </div>
    </div>
  );
}
