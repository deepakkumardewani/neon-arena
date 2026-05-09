import { useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useConnect4Store } from "@/lib/connect4/state/useConnect4Store";
import { useConnect4Settings } from "@/lib/connect4/state/useConnect4Settings";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AnimatingDisc } from "@/lib/connect4/types";
import { Cell } from "./Cell";
import { ColumnDropZone } from "./ColumnDropZone";
import { WinLine } from "./WinLine";

const COLS = 7;
const ROWS = 6;
const COL_DROP_ZONE_H = 28;

function computeCellPx(): number {
  if (typeof window === "undefined") return 72;
  return Math.min(window.innerWidth * 0.11, 72);
}

interface FallingDiscProps {
  disc: AnimatingDisc;
  animationSpeedMs: number;
  reduced: boolean;
}

function FallingDisc({ disc, animationSpeedMs, reduced }: FallingDiscProps) {
  const controls = useAnimationControls();
  const cellPx = computeCellPx();
  const rowsTravelled = disc.fromRow - disc.toRow;
  const totalDistancePx = rowsTravelled * cellPx;
  const fallDurationSec = (animationSpeedMs * Math.max(rowsTravelled, 1)) / 1000;
  const color = disc.player === 1 ? "var(--na-cyan)" : "var(--na-rose)";

  useEffect(() => {
    if (reduced) return;

    async function run() {
      await controls.start({
        y: totalDistancePx,
        transition: { duration: fallDurationSec, ease: [0.55, 0, 1, 0.45] },
      });
      await controls.start({
        scale: 1.12,
        transition: { duration: 0.06 },
      });
      await controls.start({
        scale: 1,
        transition: { duration: 0.06 },
      });
    }

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      data-testid="falling-disc"
      animate={controls}
      initial={{ y: 0, scale: 1 }}
      style={{
        position: "absolute",
        top: COL_DROP_ZONE_H,
        left: disc.col * cellPx,
        width: cellPx,
        height: cellPx,
        pointerEvents: "none",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "8%",
          borderRadius: "50%",
          background: color,
          filter: `drop-shadow(0 0 6px ${color})`,
        }}
      />
    </motion.div>
  );
}

function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

interface Connect4BoardProps {
  isThinking?: boolean;
}

export function Connect4Board({ isThinking = false }: Connect4BoardProps) {
  const { state, dropDisc, hoverColumn } = useConnect4Store();
  const { board, currentPlayer, status, winResult, hoverCol, hintCol, animatingDisc } = state;
  const { animationSpeedMs } = useConnect4Settings();
  const reduced = useReducedMotion();

  const isDisabled = isThinking || animatingDisc !== null || status !== "playing";

  const showFallingDisc = !reduced && animationSpeedMs > 0 && animatingDisc !== null;

  // Collect all placed cells for desaturation
  const allPlacedCells: [number, number][] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (board[c][r] !== null) allPlacedCells.push([c, r]);
    }
  }

  const lastMove = state.history.length > 0 ? state.history[state.history.length - 1] : null;

  const renderGrid = (winningCells: ReadonlySet<string>, desaturatedCells: ReadonlySet<string>) => (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
      {Array.from({ length: COLS }, (_, col) => {
        const isFull = board[col][ROWS - 1] !== null;
        const isHovered = hoverCol === col;
        const isHint = hintCol === col;

        return (
          <div key={col} className="flex flex-col">
            {/* Drop zone — spans above and over the column */}
            <ColumnDropZone
              col={col}
              currentPlayer={currentPlayer}
              isFull={isFull}
              isHint={isHint}
              isHovered={isHovered}
              disabled={isDisabled}
              onClick={dropDisc}
              onMouseEnter={hoverColumn}
              onMouseLeave={() => hoverColumn(null)}
            />

            {/* Cells — row 5 (top) rendered first visually */}
            {Array.from({ length: ROWS }, (_, visualRow) => {
              // row 5 = top visually → row 0 = bottom in data
              const dataRow = ROWS - 1 - visualRow;
              const key = cellKey(col, dataRow);
              const value = board[col][dataRow];

              const isWinning = winningCells.has(key);
              const isDesaturated = winResult !== null && desaturatedCells.has(key);
              const isLastPlaced =
                lastMove !== null && lastMove.col === col && lastMove.row === dataRow;
              const isAnimating =
                showFallingDisc && animatingDisc?.col === col && animatingDisc?.toRow === dataRow;

              return (
                <Cell
                  key={key}
                  value={value}
                  isWinning={isWinning}
                  isDesaturated={isDesaturated}
                  isLastPlaced={isLastPlaced && !isWinning}
                  isAnimating={isAnimating}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className="relative mx-auto"
      style={{
        maxWidth: "560px",
        background: "var(--na-surface-2, var(--na-surface))",
        border: "1px solid var(--na-border)",
        borderRadius: "12px",
        padding: "8px",
        boxShadow: "var(--na-glow-grid)",
      }}
    >
      {winResult ? (
        <WinLine winResult={winResult} allPlacedCells={allPlacedCells}>
          {renderGrid}
        </WinLine>
      ) : (
        renderGrid(new Set(), new Set())
      )}

      {showFallingDisc && animatingDisc && (
        <FallingDisc
          key={`${animatingDisc.col}-${animatingDisc.toRow}-${state.history.length}`}
          disc={animatingDisc}
          animationSpeedMs={animationSpeedMs}
          reduced={reduced}
        />
      )}
    </div>
  );
}
