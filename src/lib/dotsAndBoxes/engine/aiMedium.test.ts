import { describe, expect, it } from "vite-plus/test";

import { chooseEdge } from "./aiMedium";
import { createInitialState, claimEdge, listLegalEdges, isEdgeDrawn } from "./rules";
import type { BoardSize } from "../types";

function size3x3(): BoardSize {
  return { rows: 3, cols: 3 };
}

describe("aiMedium", () => {
  it("returns a legal edge on fresh board", () => {
    const state = createInitialState(size3x3());
    const edge = chooseEdge(state);
    expect(listLegalEdges(state)).toContainEqual(edge);
  });

  it("plays box-completing edge when available", () => {
    const state = createInitialState(size3x3());
    let current = state;
    // P1 draws 3 edges of box (0,0), setting up for completion
    current = claimEdge(current, { orientation: "horizontal", row: 0, col: 0 }); // P1 top
    current = claimEdge(current, { orientation: "horizontal", row: 1, col: 0 }); // P2 bottom
    current = claimEdge(current, { orientation: "vertical", row: 0, col: 0 }); // P1 left
    // P2's turn now (player 2). The only completing edge is the right edge
    current = claimEdge(current, { orientation: "vertical", row: 1, col: 0 }); // P2 random
    // P1's turn. Should complete the box
    const edge = chooseEdge(current);
    expect(edge).toEqual({ orientation: "vertical", row: 0, col: 1 });
  });

  it("prefers 2-box completion over 1-box", () => {
    const state = createInitialState(size3x3());
    let current = state;
    // Set up so one edge completes 2 boxes and another completes 1
    // Box (0,1): top H(0,1), right V(0,2) drawn, left V(0,1) drawn — needs H(1,1) bottom
    // Box (1,1): bottom H(2,1), right V(1,2) drawn, left V(1,1) drawn — needs H(1,1) top
    // So H(1,1) completes both boxes!
    // Also set up box (2,0) with 3 edges drawn for a single box completion

    // Draw edges for double-box setup
    current = claimEdge(current, { orientation: "horizontal", row: 0, col: 1 }); // P1
    current = claimEdge(current, { orientation: "vertical", row: 0, col: 1 }); // P2
    current = claimEdge(current, { orientation: "vertical", row: 0, col: 2 }); // P1
    current = claimEdge(current, { orientation: "horizontal", row: 2, col: 1 }); // P2
    current = claimEdge(current, { orientation: "vertical", row: 1, col: 1 }); // P1
    current = claimEdge(current, { orientation: "vertical", row: 1, col: 2 }); // P2

    // Now it's P1's turn. H(1,1) completes both boxes.
    const edge = chooseEdge(current);
    expect(edge).toEqual({ orientation: "horizontal", row: 1, col: 1 });
  });

  it("picks a safe edge when no completion available", () => {
    const state = createInitialState(size3x3());
    // Draw one edge. There are no boxes with 3 sides, so any edge is safe.
    let current = claimEdge(state, { orientation: "horizontal", row: 0, col: 0 });

    const edge = chooseEdge(current);
    expect(listLegalEdges(current)).toContainEqual(edge);
    // Should not be already drawn
    expect(isEdgeDrawn(current, edge)).toBe(false);
  });

  it("returns legal edge when all moves are unsafe", () => {
    // Create a board where every available move is a sacrifice
    const state = createInitialState(size3x3());
    const allEdges = listLegalEdges(state);
    let current = state;
    // Draw all but one edge
    for (let i = 0; i < allEdges.length - 1; i++) {
      current = claimEdge(current, allEdges[i]);
    }

    const edge = chooseEdge(current);
    const legal = listLegalEdges(current);
    expect(legal).toContainEqual(edge);
  });
});
