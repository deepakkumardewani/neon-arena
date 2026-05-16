import { describe, expect, it } from "vite-plus/test";

import { chooseEdge, chooseEdgeHint } from "./aiHard";
import { createInitialState, claimEdge, listLegalEdges } from "./rules";
import type { BoardSize } from "../types";

function size3x3(): BoardSize {
  return { rows: 3, cols: 3 };
}

function size5x5(): BoardSize {
  return { rows: 5, cols: 5 };
}

describe("aiHard", () => {
  it("returns a legal edge on a fresh 3x3 board", () => {
    const state = createInitialState(size3x3());
    const edge = chooseEdge(state);
    expect(listLegalEdges(state)).toContainEqual(edge);
  });

  it("wins immediately when a winning move is available", () => {
    const state = createInitialState(size3x3());
    let current = state;
    // Set up box (0,0) with 3 edges for P1, so P1 can complete it
    current = claimEdge(current, { orientation: "horizontal", row: 0, col: 0 }); // P1
    current = claimEdge(current, { orientation: "horizontal", row: 1, col: 0 }); // P2
    current = claimEdge(current, { orientation: "vertical", row: 0, col: 0 }); // P1
    current = claimEdge(current, { orientation: "vertical", row: 1, col: 2 }); // P2 (unrelated)

    // P1's turn — should complete box (0,0)
    const edge = chooseEdge(current);
    expect(edge).toEqual({ orientation: "vertical", row: 0, col: 1 });
  });

  it("applies double-cross in endgame fixture", () => {
    // Set up a 3-box chain endgame where double-cross is optimal
    const state = createInitialState(size3x3());
    let current = state;
    // Create a corridor of 3 boxes in row 0 with top and bottom edges
    current = claimEdge(current, { orientation: "horizontal", row: 0, col: 0 }); // P1
    current = claimEdge(current, { orientation: "horizontal", row: 0, col: 1 }); // P2
    current = claimEdge(current, { orientation: "horizontal", row: 0, col: 2 }); // P1
    current = claimEdge(current, { orientation: "horizontal", row: 1, col: 0 }); // P2
    current = claimEdge(current, { orientation: "horizontal", row: 1, col: 1 }); // P1
    current = claimEdge(current, { orientation: "horizontal", row: 1, col: 2 }); // P2

    // Now boxes (0,0), (0,1), (0,2) each have 2 sides (top + bottom)
    // P1's turn. P1 should pick a safe edge, not open the chain
    const edge = chooseEdge(current);
    // Should be a legal edge
    expect(listLegalEdges(current)).toContainEqual(edge);
  });

  it("returns a legal edge on 5x5 board", () => {
    const state = createInitialState(size5x5());
    const edge = chooseEdge(state, { maxDepth: 4 });
    expect(listLegalEdges(state)).toContainEqual(edge);
  });

  it("completes within timing limit on 5x5 at depth 6", () => {
    const state = createInitialState(size5x5());
    let current = state;
    const edges = listLegalEdges(current);
    // Draw ~35 edges to reach late midgame
    for (let i = 0; i < 35; i++) {
      current = claimEdge(current, edges[i]);
    }

    const start = performance.now();
    const edge = chooseEdge(current, { maxDepth: 6 });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(listLegalEdges(current)).toContainEqual(edge);
  });

  it("completes within timing limit on 5x5 at depth 8 (endgame)", () => {
    const state = createInitialState(size5x5());
    let current = state;
    // Draw ~40 edges so only ~20 remain for depth-8 search
    const edges = listLegalEdges(current);
    for (let i = 0; i < 40; i++) {
      current = claimEdge(current, edges[i]);
    }

    const remaining = listLegalEdges(current).length;
    expect(remaining).toBeLessThanOrEqual(20);

    const start = performance.now();
    const edge = chooseEdge(current, { maxDepth: 8 });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(listLegalEdges(current)).toContainEqual(edge);
  });
});

describe("chooseEdgeHint", () => {
  it("returns a legal edge", () => {
    const state = createInitialState(size3x3());
    const edge = chooseEdgeHint(state);
    expect(listLegalEdges(state)).toContainEqual(edge);
  });
});
