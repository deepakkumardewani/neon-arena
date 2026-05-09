import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PlayerId } from "@/lib/connect4/types";

interface ColumnDropZoneProps {
  col: number;
  currentPlayer: PlayerId;
  isFull?: boolean;
  isHint?: boolean;
  isHovered?: boolean;
  disabled?: boolean;
  onClick: (col: number) => void;
  onMouseEnter: (col: number) => void;
  onMouseLeave: () => void;
}

const PLAYER_COLORS: Record<PlayerId, string> = {
  1: "var(--na-cyan)",
  2: "var(--na-rose)",
};

export function ColumnDropZone({
  col,
  currentPlayer,
  isFull = false,
  isHint = false,
  isHovered = false,
  disabled = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ColumnDropZoneProps) {
  const reduced = useReducedMotion();
  const playerColor = PLAYER_COLORS[currentPlayer];

  const showArrow = (isHovered || isHint) && !disabled;
  const arrowColor = isHint
    ? "var(--na-cyan)"
    : isFull
      ? "var(--na-text-muted, #888)"
      : playerColor;

  const bgTint = isHint
    ? `color-mix(in srgb, var(--na-cyan) 12%, transparent)`
    : isHovered && !isFull
      ? `color-mix(in srgb, ${playerColor} 8%, transparent)`
      : "transparent";

  const handleClick = () => {
    if (disabled || isFull) return;
    onClick(col);
  };

  const handleMouseEnter = () => {
    if (!disabled) onMouseEnter(col);
  };

  return (
    <div
      className="relative flex min-w-[44px] flex-col items-center"
      style={{ background: bgTint, transition: "background 120ms ease" }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      aria-label={`Drop disc in column ${col + 1}`}
      aria-disabled={disabled || isFull}
      tabIndex={disabled || isFull ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      {/* Hover arrow above the column */}
      <div className="flex h-[28px] items-end justify-center">
        <AnimatePresence>
          {showArrow && (
            <motion.div
              key="arrow"
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
              animate={isHint ? { opacity: [1, 0.3, 1], y: 0 } : { opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : isHint
                    ? {
                        opacity: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 0.12 },
                      }
                    : { duration: 0.12 }
              }
              style={{ color: arrowColor }}
            >
              {/* Down arrow ▼ */}
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
                <path d="M7 10L0 0h14L7 10z" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
