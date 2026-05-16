import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { EdgeOrientation, PlayerId } from "@/lib/dotsAndBoxes/types";

const PLAYER_COLORS: Record<PlayerId, string> = {
  1: "var(--na-cyan)",
  2: "var(--na-rose)",
};

const CLAIM_DRAW_SECONDS = 0.18;
const HOVER_DRAW_SECONDS = 0.3;
const GHOST_STROKE_OPACITY = 0.62;

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
  isGameOver: _ignoredGameOver = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: EdgeProps) {
  const prefersReducedMotion = useReducedMotion();

  const playerColor = isDrawn && drawnBy ? PLAYER_COLORS[drawnBy] : PLAYER_COLORS[currentPlayer];
  const hoverColor = PLAYER_COLORS[currentPlayer];

  const svgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    overflow: "visible",
    animation:
      isHint && !prefersReducedMotion ? "dab-edge-hint-pulse 0.5s ease-in-out infinite" : undefined,
  };

  const glowFilter = isHint
    ? `drop-shadow(0 0 6px var(--na-cyan)) drop-shadow(0 0 12px var(--na-cyan))`
    : isLastMove && isDrawn
      ? `drop-shadow(0 0 8px ${playerColor})`
      : isHovered && !isDisabled && !isDrawn && !prefersReducedMotion
        ? `drop-shadow(0 0 6px color-mix(in srgb, ${hoverColor} 60%, transparent))`
        : undefined;

  const svgFilterStyle: CSSProperties | undefined = glowFilter ? { filter: glowFilter } : undefined;

  // Hit area: padding widens clickable band inside the uniform grid cell
  const containerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: isDisabled || isDrawn ? "default" : "pointer",
    padding: orientation === "horizontal" ? "12px 0" : "0 12px",
    boxSizing: "border-box",
    width: "100%",
    height: "100%",
  };

  const lineEnds =
    orientation === "horizontal"
      ? { x1: "0%", y1: "50%", x2: "100%", y2: "50%" }
      : { x1: "50%", y1: "0%", x2: "50%", y2: "100%" };

  const showHoverSweep = !isDrawn && !isDisabled && Boolean(isHovered) && !prefersReducedMotion;

  const hoverSnapStroke = prefersReducedMotion && !isDrawn && !isDisabled && isHovered;

  return (
    <div
      style={containerStyle}
      onClick={isDisabled || isDrawn ? undefined : onClick}
      onMouseEnter={isDisabled ? undefined : onMouseEnter}
      onMouseLeave={isDisabled ? undefined : onMouseLeave}
      role={isDisabled || isDrawn ? undefined : "button"}
      aria-label={`${orientation} edge`}
    >
      <svg style={{ ...svgStyle, ...svgFilterStyle }}>
        {isDrawn ? (
          <motion.line
            {...lineEnds}
            stroke={playerColor}
            strokeWidth={3}
            strokeOpacity={1}
            strokeLinecap="round"
            pathLength={1}
            initial={!prefersReducedMotion ? { pathLength: 0 } : undefined}
            animate={{ pathLength: 1 }}
            transition={
              !prefersReducedMotion
                ? { duration: CLAIM_DRAW_SECONDS, ease: "easeOut" }
                : { duration: 0 }
            }
          />
        ) : (
          <>
            {!hoverSnapStroke && !showHoverSweep && (
              <line
                {...lineEnds}
                stroke="var(--na-text-muted)"
                strokeWidth={2}
                strokeOpacity={GHOST_STROKE_OPACITY}
                strokeLinecap="round"
              />
            )}
            {hoverSnapStroke ? (
              <line
                {...lineEnds}
                stroke={hoverColor}
                strokeWidth={3}
                strokeOpacity={0.85}
                strokeLinecap="round"
              />
            ) : null}
            {showHoverSweep ? (
              <motion.line
                {...lineEnds}
                stroke={hoverColor}
                strokeWidth={3}
                strokeOpacity={0.9}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: HOVER_DRAW_SECONDS, ease: "easeOut" }}
              />
            ) : null}
          </>
        )}
      </svg>
    </div>
  );
}
