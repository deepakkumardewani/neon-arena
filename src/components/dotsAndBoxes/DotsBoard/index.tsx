import type { CSSProperties } from "react";
import type { BoxRef, DotsGameState, EdgeRef, PlayerId } from "@/lib/dotsAndBoxes/types";
import { Box } from "./Box";
import { Dot } from "./Dot";
import { Edge } from "./Edge";

interface DotsBoardProps {
  state: DotsGameState;
  onClaimEdge: (edge: EdgeRef) => void;
  onHoverEdge: (edge: EdgeRef | null) => void;
  isDisabled?: boolean;
  showLastMove?: boolean;
}

function edgesEqual(a: EdgeRef | null, b: EdgeRef | null): boolean {
  if (!a || !b) return false;
  return a.orientation === b.orientation && a.row === b.row && a.col === b.col;
}

function boxesContain(boxes: readonly BoxRef[], row: number, col: number): boolean {
  return boxes.some((b) => b.row === row && b.col === col);
}

export function DotsBoard({
  state,
  onClaimEdge,
  onHoverEdge,
  isDisabled = false,
  showLastMove = true,
}: DotsBoardProps) {
  const { rows, cols } = state.size;
  const isGameOver = state.status === "finished";

  // Last drawn edge from history
  const lastMove =
    showLastMove && state.history.length > 0 ? state.history[state.history.length - 1].edge : null;

  const totalCols = cols;
  const totalRows = rows;

  /** Each visual step (dot, edge segment, box) occupies one square cell in the tessellation */
  const cellsAcross = cols * 2 + 1;
  const cellSize = `min(calc((90vw - 32px) / ${cellsAcross}), calc(min(640px, calc(90vw - 32px)) / ${cellsAcross}))`;

  const cellBox: CSSProperties = {
    width: cellSize,
    height: cellSize,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        display: "inline-block",
        userSelect: "none",
        touchAction: "none",
      }}
      aria-label="Dots and Boxes board"
    >
      {/* Build row by row:
          Each "visual row" alternates between:
          - Dot-HEdge-Dot... row   (dots on edges, H-edges between)
          - VEdge-Box-VEdge... row (V-edges on edges, boxes between)
          There are (rows+1) dot rows and (rows) box rows.
          Total visual rows = rows+1 + rows = 2*rows+1
      */}
      {Array.from({ length: totalRows * 2 + 1 }, (_, visualRow) => {
        const isDotRow = visualRow % 2 === 0;
        const logicalRow = Math.floor(visualRow / 2);

        if (isDotRow) {
          // Dot row: (cols+1) dots with (cols) horizontal edges between them
          return (
            <div
              key={`dr-${logicalRow}`}
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              {Array.from({ length: totalCols * 2 + 1 }, (_, visualCol) => {
                const isDot = visualCol % 2 === 0;

                if (isDot) {
                  return (
                    <div key={`dot-${logicalRow}-${visualCol}`} style={cellBox}>
                      <Dot />
                    </div>
                  );
                }

                // Horizontal edge
                const edgeCol = Math.floor(visualCol / 2);
                const edge: EdgeRef = { orientation: "horizontal", row: logicalRow, col: edgeCol };
                const isDrawn = state.horizontalEdges[logicalRow]?.[edgeCol] ?? false;
                const drawnBy = isDrawn
                  ? (state.history.findLast((m) => edgesEqual(m.edge, edge))?.player ?? null)
                  : null;
                const isHovered = edgesEqual(state.hoveredEdge, edge);
                const isHint = edgesEqual(state.hintEdge, edge);
                const isLastMoveEdge = edgesEqual(lastMove, edge);

                return (
                  <div key={`he-${logicalRow}-${edgeCol}`} style={cellBox}>
                    <Edge
                      orientation="horizontal"
                      isDrawn={isDrawn}
                      drawnBy={drawnBy as PlayerId | null}
                      isHovered={isHovered}
                      currentPlayer={state.currentPlayer}
                      isHint={isHint}
                      isLastMove={isLastMoveEdge}
                      isDisabled={isDisabled || isGameOver}
                      isGameOver={isGameOver}
                      onClick={() => onClaimEdge(edge)}
                      onMouseEnter={() => onHoverEdge(edge)}
                      onMouseLeave={() => onHoverEdge(null)}
                    />
                  </div>
                );
              })}
            </div>
          );
        }

        // Box row: (cols+1) vertical edges with (cols) boxes between them
        const boxRow = logicalRow;
        return (
          <div
            key={`br-${boxRow}`}
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            {Array.from({ length: totalCols * 2 + 1 }, (_, visualCol) => {
              const isVEdge = visualCol % 2 === 0;

              if (isVEdge) {
                const edgeCol = visualCol / 2;
                const edge: EdgeRef = { orientation: "vertical", row: boxRow, col: edgeCol };
                const isDrawn = state.verticalEdges[boxRow]?.[edgeCol] ?? false;
                const drawnBy = isDrawn
                  ? (state.history.findLast((m) => edgesEqual(m.edge, edge))?.player ?? null)
                  : null;
                const isHovered = edgesEqual(state.hoveredEdge, edge);
                const isHint = edgesEqual(state.hintEdge, edge);
                const isLastMoveEdge = edgesEqual(lastMove, edge);

                return (
                  <div key={`ve-${boxRow}-${edgeCol}`} style={cellBox}>
                    <Edge
                      orientation="vertical"
                      isDrawn={isDrawn}
                      drawnBy={drawnBy as PlayerId | null}
                      isHovered={isHovered}
                      currentPlayer={state.currentPlayer}
                      isHint={isHint}
                      isLastMove={isLastMoveEdge}
                      isDisabled={isDisabled || isGameOver}
                      isGameOver={isGameOver}
                      onClick={() => onClaimEdge(edge)}
                      onMouseEnter={() => onHoverEdge(edge)}
                      onMouseLeave={() => onHoverEdge(null)}
                    />
                  </div>
                );
              }

              // Box
              const boxCol = Math.floor(visualCol / 2);
              const owner = state.boxOwner[boxRow]?.[boxCol] ?? null;
              const isLastClaimed = boxesContain(state.lastClaimedBoxes, boxRow, boxCol);

              return (
                <div key={`box-${boxRow}-${boxCol}`} style={cellBox}>
                  <Box owner={owner} isLastClaimed={isLastClaimed} isGameOver={isGameOver} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
