import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BoxRef, PlayerId } from "@/lib/dotsAndBoxes/types";

const PLAYER_COLORS: Record<PlayerId, string> = {
  1: "var(--na-cyan)",
  2: "var(--na-rose)",
};

interface ScoreBadgeProps {
  playerId: PlayerId;
  label: string;
  score: number;
  isActive: boolean;
  showBonusTurn: boolean;
}

function ScoreBadge({ playerId, label, score, isActive, showBonusTurn }: ScoreBadgeProps) {
  const color = PLAYER_COLORS[playerId];
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="relative flex flex-col items-center gap-1 rounded-xl border px-4 py-3 transition-all"
      style={{
        borderColor: isActive ? color : "var(--na-border)",
        background: isActive ? `color-mix(in srgb, ${color} 8%, transparent)` : undefined,
        boxShadow: isActive
          ? `0 0 10px color-mix(in srgb, ${color} 30%, transparent)`
          : undefined,
        animation:
          isActive && !prefersReducedMotion ? `na-badge-active-pulse 1.8s ease-in-out infinite` : undefined,
      }}
    >
      <span
        className="text-xs uppercase tracking-widest"
        style={{
          color: isActive ? color : "var(--na-text-muted)",
          fontFamily: "var(--na-font-display)",
        }}
      >
        {label}
      </span>
      <motion.span
        key={score}
        initial={prefersReducedMotion ? undefined : { scale: 1.25, color }}
        animate={prefersReducedMotion ? undefined : { scale: 1, color }}
        transition={prefersReducedMotion ? undefined : { duration: 0.22 }}
        className="text-2xl font-bold tabular-nums"
        style={{
          color,
          fontFamily: "var(--na-font-display)",
        }}
      >
        {score}
      </motion.span>

      {/* Bonus-turn tag (T24) */}
      <AnimatePresence>
        {showBonusTurn && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.18 }}
            style={{
              position: "absolute",
              top: "-1.25rem",
              right: "0.25rem",
              background: `color-mix(in srgb, ${color} 18%, transparent)`,
              border: `1px solid ${color}`,
              borderRadius: "0.375rem",
              padding: "1px 6px",
              color,
              fontSize: "10px",
              fontFamily: "var(--na-font-display)",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            +1 turn
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DotsBoardScoreBoardProps {
  scores: { readonly 1: number; readonly 2: number };
  currentPlayer: PlayerId;
  lastClaimedBoxes: readonly BoxRef[];
  p1Label?: string;
  p2Label?: string;
  /** Online: reorder so local user is on the left */
  localPlayer?: PlayerId;
}

export function DotsScoreBoard({
  scores,
  currentPlayer,
  lastClaimedBoxes,
  p1Label = "Player 1",
  p2Label = "Player 2",
  localPlayer,
}: DotsBoardScoreBoardProps) {
  const leftPlayer: PlayerId = localPlayer ?? 1;
  const rightPlayer: PlayerId = leftPlayer === 1 ? 2 : 1;
  const leftLabel = leftPlayer === 1 ? p1Label : p2Label;
  const rightLabel = rightPlayer === 1 ? p1Label : p2Label;

  const hasBonusTurn = lastClaimedBoxes.length > 0;

  return (
    <div
      className="flex items-center justify-center gap-6 rounded-xl border border-(--na-border) bg-(--na-surface) px-6 py-4"
      style={{ boxShadow: "var(--na-glow-grid)" }}
    >
      <ScoreBadge
        playerId={leftPlayer}
        label={leftLabel}
        score={scores[leftPlayer]}
        isActive={currentPlayer === leftPlayer}
        showBonusTurn={hasBonusTurn && currentPlayer === leftPlayer}
      />
      <span
        className="text-sm"
        style={{ color: "var(--na-text-muted)", fontFamily: "var(--na-font-display)" }}
      >
        vs
      </span>
      <ScoreBadge
        playerId={rightPlayer}
        label={rightLabel}
        score={scores[rightPlayer]}
        isActive={currentPlayer === rightPlayer}
        showBonusTurn={hasBonusTurn && currentPlayer === rightPlayer}
      />
    </div>
  );
}
