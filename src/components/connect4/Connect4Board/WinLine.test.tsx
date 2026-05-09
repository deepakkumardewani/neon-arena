import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import type { WinResult } from "@/lib/connect4/types";
import { WinLine } from "./WinLine";

describe("WinLine", () => {
  const winResult: WinResult = {
    winner: 1,
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ],
  };

  it("renders and passes correct flags to children", () => {
    const allPlaced: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
    ];

    render(
      <WinLine winResult={winResult} allPlacedCells={allPlaced}>
        {(winningCells, desaturatedCells) => (
          <div>
            <span data-testid="winning">{winningCells.size}</span>
            <span data-testid="desaturated">{desaturatedCells.size}</span>
          </div>
        )}
      </WinLine>,
    );

    expect(screen.getByTestId("winning").textContent).toBe("4");
    expect(screen.getByTestId("desaturated").textContent).toBe("1");
  });
});
