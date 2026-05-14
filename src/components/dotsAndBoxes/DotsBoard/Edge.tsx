import { motion, useReducedMotion } from "framer-motion";
import type { EdgeOrientation, PlayerId } from "@/lib/dotsAndBoxes/types";

const PLAYER_COLORS: Record<PlayerId, string> = {
  1: "var(--na-cyan)",
  2: "var(--na-rose)",
};

interface EdgeProps {
  orientation: EdgeOrientation;
  isDrawn: boolean;
  drawnBy?: PlayerId | null;
  isHovered?: boolean;
  currentPlayer?: PlayerId;
  isHint?: boolean;
  isLastMove?: boolean;
  isDisabled?: boolean;
  isGameOver?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function Edge({
  orientation,
  isDrawn,
  drawnBy,
  isHovered = false,
  currentPlayer = 1,
  isHint = false,
  isLastMove = false,
  isDisabled = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: EdgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const isHorizontal = orientation === "horizontal";

  const playerColor = isDrawn && drawnBy ? PLAYER_COLORS[drawnBy] : PLAYER_COLORS[currentPlayer];
  const hoverColor = PLAYER_COLORS[currentPlayer];

  const lineStyle: React.CSSProperties = isHorizontal
    ? { width: "100%", height: "100%" }
    : { width: "100%", height: "100%" };

  // SVG dimensions
  const svgWidth = isHorizontal ? "100%" : "100%";
  const svgHeight = isHorizontal ? "100%" : "100%";

  const strokeColor = isDrawn
    ? playerColor
    : isHovered && !isDisabled
      ? hoverColor
      : "var(--na-surface-2)";

  const strokeWidth = isDrawn || (isHovered && !isDisabled) ? 3 : 2;

  const strokeOpacity = isDrawn
    ? 1
    : isHovered && !isDisabled
      ? 0.6
      : 0.3;

  const glowFilter = isHint
    ? `drop-shadow(0 0 6px var(--na-cyan)) drop-shadow(0 0 12px var(--na-cyan))`
    : isLastMove
      ? `drop-shadow(0 0 8px ${playerColor})`
      : isHovered && !isDisabled
        ? `drop-shadow(0 0 6px color-mix(in srgb, ${hoverColor} 60%, transparent))`
        : undefined;

  // pathLength animation for drawn edges (T23)
  const pathLengthAnimation = isDrawn && !prefersReducedMotion
    ? { pathLength: [0, 1] }
    : undefined;

  const transition = !prefersReducedMotion
    ? { duration: 0.18, ease: "easeOut" }
    : { duration: 0 };

  // Hit area: 24px min via container padding
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: isDisabled || isDrawn ? "default" : "pointer",
    padding: isHorizontal ? "10px 0" : "0 10px",
    boxSizing: "border-box",
    width: "100%",
    height: "100%",
  };

  return (
    <div
      style={containerStyle}
      onClick={isDisabled || isDrawn ? undefined : onClick}
      onMouseEnter={isDisabled ? undefined : onMouseEnter}
      onMouseLeave={isDisabled ? undefined : onMouseLeave}
      role={isDisabled || isDrawn ? undefined : "button"}
      aria-label={`${orientation} edge`}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        overflow="visible"
        style={{
          ...lineStyle,
          filter: glowFilter,
          animation:
            isHint && !prefersReducedMotion
              ? "dab-edge-hint-pulse 0.5s ease-in-out infinite"
              : undefined,
        }}
      >
        {isHorizontal ? (
          <motion.line
            x1="0%"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
            strokeLinecap="round"
            pathLength={isDrawn ? 1 : undefined}
            animate={
              isDrawn && !prefersReducedMotion
                ? { pathLength: 1, opacity: strokeOpacity }
                : undefined
            }
            initial={
              isDrawn && !prefersReducedMotion
                ? { pathLength: 0, opacity: strokeOpacity }
                : undefined
            }
            transition={transition}
          />
        ) : (
          <motion.line
            x1="50%"
            y1="0%"
            x2="50%"
            y2="100%"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
            strokeLinecap="round"
            pathLength={isDrawn ? 1 : undefined}
            animate={
              isDrawn && !prefersReducedMotion
                ? { pathLength: 1, opacity: strokeOpacity }
                : undefined
            }
            initial={
              isDrawn && !prefersReducedMotion
                ? { pathLength: 0, opacity: strokeOpacity }
                : undefined
            }
            transition={transition}
          />
        )}
      </svg>
    </div>
  );
}
