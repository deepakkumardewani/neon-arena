import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface GameCardProps {
  readonly title: string;
  readonly thumbnail: ReactNode;
  readonly comingSoon?: boolean;
  readonly onSelect?: () => void;
}

export function GameCard({ title, thumbnail, comingSoon = false, onSelect }: GameCardProps) {
  const interactive = !comingSoon && onSelect !== undefined;

  const shellClass =
    "relative flex w-full flex-col overflow-hidden rounded-tl-2xl rounded-br-2xl rounded-tr-lg rounded-bl-lg border border-(--na-border) bg-(--na-surface) text-left transition-[border-color,box-shadow] duration-200";

  const body = (
    <>
      <div className="aspect-video w-full border-b border-(--na-border) bg-(--na-bg)">
        {thumbnail}
      </div>
      <div className="flex flex-col gap-1.5 px-5 py-4 md:px-6 md:py-5">
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

  if (!interactive) {
    return (
      <article
        className={`${shellClass} opacity-50`}
        style={{ pointerEvents: "none" }}
        aria-label={`${title}, coming soon`}
      >
        {body}
      </article>
    );
  }

  return (
    <motion.button
      type="button"
      className={`${shellClass} cursor-pointer`}
      onClick={onSelect}
      aria-label={`${title}, play now`}
      whileHover={{
        boxShadow: "var(--na-glow-x)",
        borderColor: "var(--na-cyan)",
      }}
      whileTap={{ scale: 0.992 }}
      transition={{ type: "spring", stiffness: 440, damping: 30 }}
    >
      {body}
    </motion.button>
  );
}
