import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { createInitialState } from "@/lib/connect4/engine/rules";
import { Connect4ScoreBoard } from "./index";

describe("Connect4ScoreBoard", () => {
  it("renders 0-0-0 on mount", () => {
    const state = { ...createInitialState(), status: "playing" as const };
    render(<Connect4ScoreBoard gameState={state} />);
    const scores = screen.getAllByText("0");
    expect(scores.length).toBeGreaterThanOrEqual(3);
  });

  it("renders without crash with draw state", () => {
    const state = {
      ...createInitialState(),
      status: "finished" as const,
      isDraw: true,
    };
    render(<Connect4ScoreBoard gameState={state} />);
  });

  it("renders without crash with p1 win state", () => {
    const state = {
      ...createInitialState(),
      status: "finished" as const,
      winResult: {
        winner: 1 as const,
        cells: [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
        ] as [number, number][],
      },
    };
    render(<Connect4ScoreBoard gameState={state} />);
  });
});
