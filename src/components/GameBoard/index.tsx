import { useEffect, useRef, useState } from "react";

import { GlyphO } from "@/components/GlyphO";
import { GlyphX } from "@/components/GlyphX";
import type { BoardCell } from "@/types/game";

export interface GameBoardProps {
  readonly board: readonly BoardCell[];
  readonly winLine: readonly number[] | null;
  readonly winner: "X" | "O" | null;
  readonly onCellClick: (index: number) => void;
  /** When true, empty cells are not playable (e.g. Firebase offline in online modes). */
  readonly interactionLocked?: boolean;
}

function CellGlyph({ mark }: { readonly mark: BoardCell }) {
  const prev = useRef<BoardCell>(mark);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (mark === null) {
      prev.current = null;
      return;
    }
    if (prev.current === null) {
      setAnimate(true);
      const id = window.setTimeout(() => {
        setAnimate(false);
      }, 450);
      prev.current = mark;
      return () => {
        window.clearTimeout(id);
      };
    }
    prev.current = mark;
    return undefined;
  }, [mark]);

  if (mark === "X") {
    return <GlyphX animate={animate} className="h-full w-full p-2" />;
  }
  if (mark === "O") {
    return <GlyphO animate={animate} className="h-full w-full p-2" />;
  }
  return null;
}

export function GameBoard({
  board,
  winLine,
  winner,
  onCellClick,
  interactionLocked = false,
}: GameBoardProps) {
  const winSet = winLine === null ? null : new Set(winLine);

  return (
    <div
      className="mx-auto w-full max-w-full rounded-sm p-[2px] shadow-(--na-glow-grid)"
      style={{
        aspectRatio: "1",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "2px",
        backgroundColor: "var(--na-purple)",
      }}
    >
      {board.map((cell, index) => {
        const occupied = cell !== null;
        const isWinning = winSet?.has(index) ?? false;
        const winPulse =
          isWinning && winner !== null
            ? {
                animation: "glow-pulse-win 1.2s ease-in-out infinite",
                ["--na-win-pulse" as string]: winner === "O" ? "var(--na-rose)" : "var(--na-cyan)",
              }
            : undefined;

        const row = Math.floor(index / 3) + 1;
        const col = (index % 3) + 1;
        const shapeWord = cell === "X" ? "X cross" : cell === "O" ? "O ring" : "empty";
        const ariaLabel = `Square row ${row} column ${col}, ${shapeWord}`;

        return (
          <button
            key={index}
            type="button"
            aria-label={ariaLabel}
            disabled={occupied || interactionLocked}
            className="relative flex min-h-0 min-w-0 items-center justify-center border-0 bg-(--na-surface) p-0 outline-none focus-visible:ring-2 focus-visible:ring-(--na-cyan) focus-visible:ring-offset-2 focus-visible:ring-offset-(--na-bg) disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:brightness-110"
            style={winPulse}
            onClick={() => {
              onCellClick(index);
            }}
          >
            <CellGlyph mark={cell} />
          </button>
        );
      })}
    </div>
  );
}
