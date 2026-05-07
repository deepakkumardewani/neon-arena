import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useChessStore } from "@/lib/chess/state/useChessStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ChessMove } from "@/lib/chess/types";

interface MovePair {
  moveNumber: number;
  white: ChessMove;
  black: ChessMove | null;
}

function buildMovePairs(history: readonly ChessMove[]): MovePair[] {
  const pairs: MovePair[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1] ?? null,
    });
  }
  return pairs;
}

interface Props {
  show?: boolean;
}

function MoveHistoryContent({
  pairs,
  currentMoveIndex,
  showClose,
  onClose,
}: {
  pairs: MovePair[];
  currentMoveIndex: number;
  showClose: boolean;
  onClose: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pairs.length]);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-(--na-border) bg-(--na-surface)"
      style={{ boxShadow: "var(--na-glow-grid)" }}
      aria-label="Move history"
    >
      <div
        className="flex items-center justify-between border-b border-(--na-border) px-3 py-2"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        <span className="text-xs font-semibold tracking-[0.18em] text-(--na-text-muted) uppercase">
          Moves
        </span>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-(--na-border) px-2 py-0.5 text-[10px] text-(--na-text-muted) hover:text-(--na-text)"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            Close
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2" style={{ maxHeight: "40vh" }}>
        {pairs.length === 0 ? (
          <p className="px-1 py-2 text-xs text-(--na-text-muted)">No moves yet</p>
        ) : (
          <table
            className="w-full text-xs"
            style={{ fontFamily: "var(--na-font-mono, monospace)" }}
          >
            <tbody>
              {pairs.map((pair) => {
                const whiteIdx = (pair.moveNumber - 1) * 2;
                const blackIdx = whiteIdx + 1;
                const isCurrentWhite = currentMoveIndex === whiteIdx;
                const isCurrentBlack = currentMoveIndex === blackIdx;

                return (
                  <tr
                    key={pair.moveNumber}
                    className="group transition-colors hover:bg-(--na-surface-2)/40"
                  >
                    <td
                      className="w-7 select-none py-0.5 pr-1 text-right text-(--na-text-muted)"
                      aria-hidden="true"
                    >
                      {pair.moveNumber}.
                    </td>
                    <td
                      className="px-1.5 py-0.5 font-medium"
                      style={{
                        color: isCurrentWhite ? "var(--na-cyan)" : "var(--na-text)",
                        background: isCurrentWhite ? "var(--na-cyan)/10" : undefined,
                      }}
                    >
                      {pair.white.san}
                    </td>
                    <td
                      className="px-1.5 py-0.5 font-medium"
                      style={{
                        color: isCurrentBlack ? "var(--na-cyan)" : "var(--na-text-muted)",
                        background: isCurrentBlack ? "var(--na-cyan)/10" : undefined,
                      }}
                    >
                      {pair.black?.san ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export function MoveHistoryPanel({ show = true }: Props) {
  const history = useChessStore((s) => s.state.history);
  const reduced = useReducedMotion();
  const currentMoveIndex = history.length - 1;

  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!show) return null;

  const pairs = buildMovePairs(history);

  return (
    <>
      <div className="hidden lg:block">
        <MoveHistoryContent
          pairs={pairs}
          currentMoveIndex={currentMoveIndex}
          showClose={false}
          onClose={() => setDrawerOpen(false)}
        />
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-(--na-border) bg-(--na-surface) px-4 py-3 text-sm"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          <span className="text-(--na-text-muted)">
            Moves {pairs.length > 0 ? `(${pairs.length})` : ""}
          </span>
          <span className="text-[10px] tracking-widest text-(--na-cyan) uppercase">View</span>
        </button>

        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close move history"
                className="fixed inset-0 z-[55] bg-black/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.15 }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                className="fixed inset-x-0 bottom-0 z-[60] max-h-[60vh] overflow-auto rounded-t-2xl border-t border-(--na-border) bg-(--na-surface)"
                initial={{ y: reduced ? 0 : "100%" }}
                animate={{ y: 0 }}
                exit={{ y: reduced ? 0 : "100%" }}
                transition={
                  reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                }
              >
                <MoveHistoryContent
                  pairs={pairs}
                  currentMoveIndex={currentMoveIndex}
                  showClose
                  onClose={() => setDrawerOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
