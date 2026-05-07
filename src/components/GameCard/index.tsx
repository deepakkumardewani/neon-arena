import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface GameCardProps {
  readonly title: string;
  readonly thumbnail: ReactNode;
  readonly comingSoon?: boolean;
  readonly onSelect?: () => void;
}

export function GameCard({ title, thumbnail, comingSoon = false, onSelect }: GameCardProps) {
  const reducedMotion = useReducedMotion();
  const interactive = !comingSoon && onSelect !== undefined;

  const shellClass =
    "group relative flex w-full flex-col overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-lg rounded-bl-lg border border-(--na-border) bg-(--na-surface) text-left transition-[border-color,box-shadow] duration-200";

  const body = (
    <>
      <div className="aspect-video w-full border-b border-(--na-border) bg-(--na-bg)">
        {thumbnail}
      </div>
      <div className="flex flex-col px-5 py-4 md:px-6 md:py-5" style={{ gap: "var(--na-space-3)" }}>
        <h2
          className="text-base font-semibold tracking-[0.12em] text-(--na-text) uppercase"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          {title}
        </h2>
        {comingSoon ? (
          <span
            className="inline-flex w-fit rounded-sm border border-(--na-purple) px-2 py-0.5 text-[10px] tracking-[0.2em] text-(--na-purple) uppercase"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            Coming Soon
          </span>
        ) : null}
      </div>
    </>
  );

  const hoverAnimation = reducedMotion
    ? { boxShadow: "var(--na-glow-x)", borderColor: "var(--na-cyan)" }
    : { y: -3, boxShadow: "var(--na-glow-x)", borderColor: "var(--na-cyan)" };

  if (!interactive) {
    return (
      <motion.div
        className={`${shellClass} cursor-not-allowed`}
        aria-label={`${title}, coming soon`}
        whileHover={hoverAnimation}
        transition={{ type: "spring", stiffness: 440, damping: 30 }}
      >
        {body}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      className={`${shellClass} cursor-pointer`}
      onClick={onSelect}
      aria-label={`${title}, play now`}
      whileHover={hoverAnimation}
      whileTap={{ scale: 0.992 }}
      transition={{ type: "spring", stiffness: 440, damping: 30 }}
    >
      {body}
    </motion.button>
  );
}
