import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { PieceColor, PieceType } from "@/lib/chess/types";
import { useChessStore } from "@/lib/chess/state/useChessStore";
import { ChessPiece } from "@/components/chess/ChessPiece";

const PROMOTION_PIECES: PieceType[] = ["queen", "rook", "bishop", "knight"];

interface PieceButtonProps {
  type: PieceType;
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
}

function PieceButton({ type, color, onSelect }: PieceButtonProps) {
  const accentColor = color === "white" ? "var(--na-cyan)" : "var(--na-rose)";
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className="group flex flex-col items-center gap-2 rounded-xl border p-3 transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
      style={{
        borderColor: "var(--na-border)",
        background: "var(--na-surface-2, var(--na-surface))",
        minWidth: "72px",
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = accentColor;
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--na-border)";
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = accentColor;
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          `0 0 12px color-mix(in srgb, ${accentColor} 40%, transparent)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--na-border)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
      aria-label={`Promote to ${type}`}
    >
      <ChessPiece piece={{ type, color }} size={48} className="drop-shadow-lg" />
      <span
        className="text-xs font-semibold capitalize"
        style={{ color: "var(--na-text-muted)", fontFamily: "var(--na-font-display)" }}
      >
        {type}
      </span>
    </button>
  );
}

export function PromotionModal() {
  const promotionPending = useChessStore((s) => s.state.promotionPending);
  const activeColor = useChessStore((s) => s.state.activeColor);
  const resolvePromotion = useChessStore((s) => s.resolvePromotion);
  const reduced = useReducedMotion();
  const firstButtonRef = useRef<HTMLDivElement>(null);

  const isOpen = promotionPending !== null;

  // Focus first button when modal opens
  useEffect(() => {
    if (isOpen) {
      const firstBtn = firstButtonRef.current?.querySelector("button");
      firstBtn?.focus();
    }
  }, [isOpen]);

  // Trap Tab within modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const modal = firstButtonRef.current;
    if (!modal) return;
    const focusable = Array.from(modal.querySelectorAll<HTMLElement>("button"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — intentionally non-dismissible */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.15 }}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Choose promotion piece"
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-4 rounded-t-2xl border border-(--na-border) bg-(--na-surface) px-6 pb-8 pt-5 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:w-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
            style={{ boxShadow: "var(--na-glow-grid)" }}
            initial={{ y: reduced ? 0 : 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : 60, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
            onKeyDown={handleKeyDown}
          >
            <h2
              className="text-sm font-semibold tracking-[0.16em] text-(--na-text-muted) uppercase"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              Choose promotion piece
            </h2>

            <div ref={firstButtonRef} className="flex gap-3">
              {PROMOTION_PIECES.map((type) => (
                <PieceButton
                  key={type}
                  type={type}
                  color={activeColor}
                  onSelect={resolvePromotion}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
