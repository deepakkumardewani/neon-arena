import type { WinResult } from "@/lib/connect4/types";

interface WinLineProps {
  winResult: WinResult;
  /** Total cells on the board as [col, row] pairs with disc values — used to compute desaturation */
  allPlacedCells: readonly [number, number][];
  children: (
    winningCells: ReadonlySet<string>,
    desaturatedCells: ReadonlySet<string>,
  ) => React.ReactNode;
}

function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function WinLine({ winResult, allPlacedCells, children }: WinLineProps) {
  const winningCells = new Set(winResult.cells.map(([col, row]) => cellKey(col, row)));

  const desaturatedCells = new Set(
    allPlacedCells.map(([col, row]) => cellKey(col, row)).filter((key) => !winningCells.has(key)),
  );

  return <>{children(winningCells, desaturatedCells)}</>;
}
