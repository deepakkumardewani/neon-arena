import { motion } from "framer-motion";

/** Mock count until Phase 7 presence wiring (Task 30). */
const MOCK_ONLINE_PLAYERS = 428;

export interface OnlineCounterProps {
  readonly count?: number;
  readonly className?: string;
}

export function OnlineCounter({ count = MOCK_ONLINE_PLAYERS, className = "" }: OnlineCounterProps) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border border-(--na-border) bg-(--na-surface) px-4 py-2.5 text-sm text-(--na-text) ${className}`}
      role="status"
      aria-live="polite"
    >
      <motion.span
        className="relative flex size-2.5 items-center justify-center"
        aria-hidden
        animate={{ opacity: [1, 0.55, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="absolute inline-block size-2.5 rounded-full bg-(--na-cyan) opacity-35 blur-[3px]" />
        <span className="relative inline-block size-2 rounded-full bg-(--na-cyan)" />
      </motion.span>
      <span>
        <span
          className="font-semibold tabular-nums text-(--na-cyan)"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          {count}
        </span>
        <span className="text-(--na-text-muted)"> players online</span>
      </span>
    </div>
  );
}
