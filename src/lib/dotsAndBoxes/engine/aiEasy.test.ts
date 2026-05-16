import { describe, expect, it } from "vite-plus/test";

import { chooseEdge } from "./aiEasy";
import { createInitialState, claimEdge, listLegalEdges, isEdgeDrawn } from "./rules";
import type { BoardSize, EdgeRef } from "../types";

function size3x3(): BoardSize {
  return { rows: 3, cols: 3 };
}

describe("aiEasy", () => {
  it("returns a legal edge from fresh board", () => {
    const state = createInitialState(size3x3());
    const edge = chooseEdge(state);
    const legal = listLegalEdges(state);
    expect(legal).toContainEqual(edge);
  });

  it("never returns an already-drawn edge", () => {
    const state = createInitialState(size3x3());
    const edge: EdgeRef = { orientation: "horizontal", row: 0, col: 0 };
    const next = claimEdge(state, edge);

    for (let i = 0; i < 50; i++) {
      const chosen = chooseEdge(next);
      expect(isEdgeDrawn(next, chosen)).toBe(false);
    }
  });

  it("returns a valid EdgeRef on a 5x5 board", () => {
    const state = createInitialState({ rows: 5, cols: 5 });
    const edge = chooseEdge(state);
    const legal = listLegalEdges(state);
    expect(legal).toContainEqual(edge);
  });

  it("handles single-legal-edge board", () => {
    const state = createInitialState(size3x3());
    const allEdges = listLegalEdges(state);
    let current = state;
    // Draw all edges except the last one
    for (let i = 0; i < allEdges.length - 1; i++) {
      current = claimEdge(current, allEdges[i]);
    }
    const remaining = listLegalEdges(current);
    expect(remaining).toHaveLength(1);
    expect(chooseEdge(current)).toEqual(remaining[0]);
  });

  it("distribution is roughly uniform on 5x5 (statistical check)", () => {
    const state = createInitialState({ rows: 5, cols: 5 });
    const counts = new Map<string, number>();
    const trials = 500;

    for (let i = 0; i < trials; i++) {
      const edge = chooseEdge(state);
      const key = `${edge.orientation}:${edge.row}:${edge.col}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const legal = listLegalEdges(state);
    // Allow 50% deviation from expected (generous for randomness)
    for (const edge of legal) {
      const key = `${edge.orientation}:${edge.row}:${edge.col}`;
      const count = counts.get(key) ?? 0;
      // Each edge should be picked at least once with 500 trials on 60 edges
      expect(count).toBeGreaterThan(0);
    }
  });
});
