import { useId } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface GlyphOProps {
  readonly animate?: boolean;
  readonly className?: string;
}

const vb = "0 0 100 100";

export function GlyphO({ animate = false, className }: GlyphOProps) {
  const reduced = useReducedMotion();
  const shouldAnimate = animate && !reduced;
  const gid = useId().replace(/:/g, "");

  return (
    <svg
      className={className}
      viewBox={vb}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <filter id={`na-glyph-o-glow-${gid}`} colorInterpolationFilters="sRGB">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2"
            floodColor="var(--na-rose)"
            floodOpacity="0.9"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="8"
            floodColor="var(--na-rose)"
            floodOpacity="0.45"
          />
        </filter>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="32"
        stroke="var(--na-rose)"
        strokeWidth="10"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={shouldAnimate ? 1 : 0}
        filter={`url(#na-glyph-o-glow-${gid})`}
        className={shouldAnimate ? "na-draw-o" : undefined}
      />
    </svg>
  );
}
