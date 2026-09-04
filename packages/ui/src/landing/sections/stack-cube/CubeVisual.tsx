import { stackCubeFaces } from "../../config/info";
import { twMerge } from "tailwind-merge";

const FACE_TEXTURE_CLASSES = [
  "cube-face--front",
  "cube-face--right",
  "cube-face--back",
  "cube-face--left",
] as const;

type CubeVisualProps = {
  className?: string;
};

export function CubeVisual({ className }: CubeVisualProps) {
  return (
    <div className="cube-perspective">
      <div className={twMerge("cube-scene", className)}>
        {stackCubeFaces.map((face, index) => (
          <div key={face.label} className={`cube-face ${FACE_TEXTURE_CLASSES[index]}`} />
        ))}
      </div>
    </div>
  );
}
