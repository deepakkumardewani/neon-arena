import { motion, useReducedMotion } from "framer-motion";
import type { PlayerId } from "@/lib/dotsAndBoxes/types";

const PLAYER_COLORS: Record<PlayerId, string> = {
  1: "var(--na-cyan)",
  2: "var(--na-rose)",
};

const PLAYER_INITIALS: Record<PlayerId, string> = {
  1: "A",
  2: "B",
};

interface BoxProps {
  owner: PlayerId | null;
  isLastClaimed?: boolean;
  isGameOver?: boolean;
}

export function Box({ owner, isLastClaimed = false, isGameOver = false }: BoxProps) {
  const prefersReducedMotion = useReducedMotion();

  if (owner === null) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: isGameOver ? 0.2 : 0,
          transition: isGameOver && !prefersReducedMotion ? "opacity 0.2s ease-out" : undefined,
        }}
      />
    );
  }

  const color = PLAYER_COLORS[owner];

  return (
    <motion.div
      style={{
        width: "100%",
        height: "100%",
        background: `color-mix(in srgb, ${color} 22%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxShadow: isLastClaimed
          ? `0 0 12px color-mix(in srgb, ${color} 60%, transparent), 0 0 24px color-mix(in srgb, ${color} 30%, transparent)`
          : undefined,
      }}
      initial={prefersReducedMotion ? undefined : { scale: 0.6, opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
      transition={
        prefersReducedMotion
          ? undefined
          : { type: "spring", stiffness: 280, damping: 24, duration: 0.22 }
      }
      className={isLastClaimed && !prefersReducedMotion ? "na-dab-box-claim-glow" : undefined}
    >
      <motion.span
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
        transition={prefersReducedMotion ? undefined : { delay: 0.08, duration: 0.08 }}
        style={{
          color,
          fontFamily: "var(--na-font-display)",
          fontSize: "clamp(10px, 2.5vw, 16px)",
          fontWeight: 700,
          userSelect: "none",
          lineHeight: 1,
        }}
      >
        {PLAYER_INITIALS[owner]}
      </motion.span>
    </motion.div>
  );
}
