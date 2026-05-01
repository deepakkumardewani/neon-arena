import { useId } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface GlyphXProps {
  readonly animate?: boolean;
  readonly className?: string;
}

const vb = "0 0 100 100";
const strokeWidth = 10;

export function GlyphX({ animate = false, className }: GlyphXProps) {
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
        <filter
          id={`na-glyph-x-glow-${gid}`}
          colorInterpolationFilters="sRGB"
          filterUnits="objectBoundingBox"
          x="-0.45"
          y="-0.45"
          width="1.9"
          height="1.9"
        >
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2"
            floodColor="var(--na-cyan)"
            floodOpacity="0.9"
          />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="8"
            floodColor="var(--na-cyan)"
            floodOpacity="0.45"
          />
        </filter>
      </defs>
      <g filter={`url(#na-glyph-x-glow-${gid})`}>
        <line
          x1="22"
          y1="22"
          x2="78"
          y2="78"
          stroke="var(--na-cyan)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={shouldAnimate ? 1 : 0}
          className={shouldAnimate ? "na-draw-x-1" : undefined}
        />
        <line
          x1="78"
          y1="22"
          x2="22"
          y2="78"
          stroke="var(--na-cyan)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={shouldAnimate ? 1 : 0}
          className={shouldAnimate ? "na-draw-x-2" : undefined}
        />
      </g>
    </svg>
  );
}
