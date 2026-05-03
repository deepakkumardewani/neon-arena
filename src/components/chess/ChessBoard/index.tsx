import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type {
  ChessPiece as ChessPieceType,
  PieceColor,
  PieceType,
  SquareIndex,
} from "@/lib/chess/types";
import { useChessStore } from "@/lib/chess/state/useChessStore";
import { ChessPiece } from "../ChessPiece";
import { BoardLabels } from "./BoardLabels";
import { Square } from "./Square";

// ── FEN parser ──────────────────────────────────────────────────────────────

const PIECE_TYPE_MAP: Record<string, PieceType> = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};

function parseFenBoard(fen: string): (ChessPieceType | null)[] {
  const board: (ChessPieceType | null)[] = new Array(64).fill(null);
  const ranks = fen.split(" ")[0].split("/"); // rank[0] = rank 8

  ranks.forEach((rank, rankIdx) => {
    const internalRow = 7 - rankIdx; // rank 8 → row 7
    let col = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        col += parseInt(ch, 10);
      } else {
        board[internalRow * 8 + col] = {
          type: PIECE_TYPE_MAP[ch.toLowerCase()] as PieceType,
          color: ch === ch.toUpperCase() ? "white" : ("black" as PieceColor),
        };
        col++;
      }
    }
  });

  return board;
}

/** Convert visual (row, col) → square index based on flip */
function visualToIndex(row: number, col: number, flipped: boolean): SquareIndex {
  return flipped ? row * 8 + (7 - col) : (7 - row) * 8 + col;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** Flip board so black is at bottom. Default: false (white at bottom). */
  flipped?: boolean;
  /** When true, no moves are accepted (spectator / game-over). */
  locked?: boolean;
}

export function ChessBoard({ flipped = false, locked = false }: Props) {
  const { state, selectSquare } = useChessStore();
  const reduced = useReducedMotion();
  const boardRef = useRef<HTMLDivElement>(null);

  // Drag state — stores source square + current pointer position
  const [dragging, setDragging] = useState<{ from: SquareIndex; x: number; y: number } | null>(
    null,
  );
  const draggingRef = useRef(dragging);
  draggingRef.current = dragging;

  // Detect coarse pointer (touch/mobile) — disable drag
  const isCoarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  const board = parseFenBoard(state.fen);

  // King in check index for check-flash highlight
  const checkedKingIndex: SquareIndex | null = (() => {
    if (state.status !== "check" && state.status !== "checkmate") return null;
    const idx = board.findIndex((p) => p?.type === "king" && p.color === state.activeColor);
    return idx === -1 ? null : idx;
  })();

  const lastMove = state.history.length > 0 ? state.history[state.history.length - 1] : null;

  // ── Drag helpers ───────────────────────────────────────────────────────────

  const getIndexFromPoint = useCallback(
    (clientX: number, clientY: number): SquareIndex | null => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();
      const col = Math.floor(((clientX - rect.left) / rect.width) * 8);
      const row = Math.floor(((clientY - rect.top) / rect.height) * 8);
      if (col < 0 || col >= 8 || row < 0 || row >= 8) return null;
      return visualToIndex(row, col, flipped);
    },
    [flipped],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: SquareIndex) => {
      if (isCoarse || locked) return;
      const piece = board[index];
      if (!piece || piece.color !== state.activeColor) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDragging({ from: index, x: e.clientX, y: e.clientY });
    },
    // board changes every render (derived from fen) — include fen as dep proxy
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isCoarse, locked, state.activeColor, state.fen],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    setDragging((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null));
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = draggingRef.current;
      if (!d) return;
      setDragging(null);
      const targetIndex = getIndexFromPoint(e.clientX, e.clientY);
      if (targetIndex === null || targetIndex === d.from) return;
      // Ensure source is selected, then fire destination
      if (state.selectedSquare !== d.from) selectSquare(d.from);
      selectSquare(targetIndex);
    },
    [getIndexFromPoint, selectSquare, state.selectedSquare],
  );

  // ── Board square size for ghost (fallback 60px before first render) ────────

  const squareSize = boardRef.current ? boardRef.current.getBoundingClientRect().width / 8 : 60;

  const dragGhostPiece = dragging ? board[dragging.from] : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative"
      style={{ width: "min(100%, min(100vw, calc(100vh - 8rem)))" }}
      aria-label="Chess board"
    >
      {/* 8×8 grid */}
      <div
        ref={boardRef}
        className="relative grid"
        style={{ gridTemplateColumns: "repeat(8, 1fr)", aspectRatio: "1" }}
        onPointerMove={dragging ? handlePointerMove : undefined}
        onPointerUp={dragging ? handlePointerUp : undefined}
        onPointerCancel={() => setDragging(null)}
      >
        {Array.from({ length: 64 }, (_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const index = visualToIndex(row, col, flipped);
          const piece = board[index];
          const isDragSource = dragging?.from === index;

          return (
            <div key={index} className="relative">
              {/* Square with all highlight layers (no piece rendered inside) */}
              <Square
                index={index}
                piece={null} // pieces rendered separately for animation
                isLight={(row + col) % 2 === 0}
                isSelected={state.selectedSquare === index}
                isLegalMove={state.legalMoves.includes(index)}
                isLastMoveFrom={lastMove?.from === index}
                isLastMoveTo={lastMove?.to === index}
                isHintFrom={state.hintFrom === index}
                isHintTo={state.hintTo === index}
                isInCheck={checkedKingIndex === index}
                onClick={locked ? () => undefined : selectSquare}
                onPointerDown={!isCoarse ? handlePointerDown : undefined}
              />

              {/* Piece layer — AnimatePresence handles capture fade-out */}
              <AnimatePresence>
                {piece && !isDragSource && (
                  <motion.div
                    key={`${piece.type}-${piece.color}`}
                    layoutId={`piece-${piece.color}-${piece.type}-${index}`}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center p-[6%]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={
                      reduced ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 35 }
                    }
                  >
                    <ChessPiece piece={piece} size={40} className="h-full w-full" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Rank / file labels */}
      <div className="pointer-events-none absolute inset-0">
        <BoardLabels flipped={flipped} />
      </div>

      {/* Drag ghost — follows pointer */}
      <AnimatePresence>
        {dragging && dragGhostPiece && (
          <motion.div
            className="pointer-events-none fixed z-50 flex items-center justify-center"
            style={{
              width: squareSize,
              height: squareSize,
              left: dragging.x - squareSize / 2,
              top: dragging.y - squareSize / 2,
              filter: `drop-shadow(0 0 8px ${
                dragGhostPiece.color === "white" ? "var(--na-cyan)" : "var(--na-rose)"
              })`,
            }}
            initial={{ opacity: 0.85, scale: 1.15 }}
            animate={{ opacity: 0.95, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.08 }}
          >
            <ChessPiece piece={dragGhostPiece} size={squareSize} className="h-full w-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
