import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface ModeCardProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly selected?: boolean;
  readonly onClick: () => void;
}

export function ModeCard({ icon, title, description, selected = false, onClick }: ModeCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-4 rounded-tl-2xl rounded-br-xl rounded-tr-md rounded-bl-md border px-4 py-4 text-left transition-colors md:gap-5 md:px-6 md:py-5 ${
        selected
          ? "border-(--na-cyan) bg-(--na-surface) shadow-(--na-glow-x)"
          : "border-(--na-border) bg-(--na-surface) hover:border-(--na-purple)"
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.992 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      aria-pressed={selected}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm border md:size-14 ${
          selected
            ? "border-(--na-cyan) text-(--na-cyan)"
            : "border-(--na-border) text-(--na-purple)"
        }`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-base font-semibold tracking-[0.08em] text-(--na-text) uppercase md:text-lg"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          {title}
        </span>
        <span className="mt-1.5 block text-sm leading-snug text-(--na-text-muted) md:text-[0.9375rem]">
          {description}
        </span>
      </span>
    </motion.button>
  );
}
