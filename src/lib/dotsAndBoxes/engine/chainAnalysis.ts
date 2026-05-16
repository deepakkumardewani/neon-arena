import type { BoxRef, DotsGameState, EdgeRef } from "../types";
import { isBoxComplete } from "./rules";

function sidesDrawnForBox(state: DotsGameState, box: BoxRef): number {
  const { row: br, col: bc } = box;
  let count = 0;
  if (state.horizontalEdges[br][bc]) count++;
  if (state.horizontalEdges[br + 1][bc]) count++;
  if (state.verticalEdges[br][bc]) count++;
  if (state.verticalEdges[br][bc + 1]) count++;
  return count;
}

function boxesAreAdjacent(a: BoxRef, b: BoxRef): boolean {
  if (a.row === b.row && Math.abs(a.col - b.col) === 1) return true;
  if (a.col === b.col && Math.abs(a.row - b.row) === 1) return true;
  return false;
}

export function detectChains(state: DotsGameState): BoxRef[][] {
  const { rows, cols } = state.size;

  // Find all chain boxes: unclaimed boxes with exactly 2 sides drawn
  const chainBoxes: BoxRef[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const box: BoxRef = { row: r, col: c };
      if (
        state.boxOwner[r][c] === null &&
        !isBoxComplete(state, box) &&
        sidesDrawnForBox(state, box) === 2
      ) {
        chainBoxes.push(box);
      }
    }
  }

  // Group connected chain boxes using BFS
  const visited = new Set<string>();
  const chains: BoxRef[][] = [];

  for (const startBox of chainBoxes) {
    const key = `${startBox.row},${startBox.col}`;
    if (visited.has(key)) continue;

    const chain: BoxRef[] = [];
    const queue: BoxRef[] = [startBox];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift()!;
      chain.push(current);

      for (const other of chainBoxes) {
        const otherKey = `${other.row},${other.col}`;
        if (visited.has(otherKey)) continue;
        if (boxesAreAdjacent(current, other)) {
          visited.add(otherKey);
          queue.push(other);
        }
      }
    }

    chains.push(chain);
  }

  return chains;
}

export function chainLength(chain: BoxRef[]): number {
  return chain.length;
}

export function isLoonySacrifice(state: DotsGameState, edge: EdgeRef): boolean {
  const { rows, cols } = state.size;
  const boxes: BoxRef[] = [];

  if (edge.orientation === "horizontal") {
    if (edge.row > 0) boxes.push({ row: edge.row - 1, col: edge.col });
    if (edge.row < rows) boxes.push({ row: edge.row, col: edge.col });
  } else {
    if (edge.col > 0) boxes.push({ row: edge.row, col: edge.col - 1 });
    if (edge.col < cols) boxes.push({ row: edge.row, col: edge.col });
  }

  // The edge is a loony sacrifice if it adds a 3rd side to any unclaimed box
  for (const box of boxes) {
    if (state.boxOwner[box.row][box.col] !== null) continue;
    if (isBoxComplete(state, box)) continue;

    const drawn = sidesDrawnForBox(state, box);
    // If this box already has 2 sides, adding this (3rd) edge gives the opponent
    // a chance to complete it
    if (drawn === 2) {
      // Check this edge isn't already one of the drawn sides
      let edgeIsDrawn = false;
      if (edge.orientation === "horizontal") {
        edgeIsDrawn = state.horizontalEdges[edge.row][edge.col];
      } else {
        edgeIsDrawn = state.verticalEdges[edge.row][edge.col];
      }
      if (!edgeIsDrawn) return true;
    }
  }

  return false;
}

export function doubleCrossEdge(state: DotsGameState, chain: BoxRef[]): EdgeRef | null {
  if (chain.length < 3) return null;

  // The double-cross sacrifices 2 boxes: find the edge that opens
  // the chain at the right position to leave exactly 2 boxes for the opponent.
  // The "edge before the last 2 boxes" — the edge that, when drawn,
  // lets the opponent claim the last 2 boxes of the chain.

  // Find an undrawn edge adjacent to the 2nd-to-last box in the chain
  // that, when drawn, gives the 3rd side to that box
  const targetBox = chain[chain.length - 2];
  const { row: br, col: bc } = targetBox;

  const candidateEdges: EdgeRef[] = [
    { orientation: "horizontal", row: br, col: bc },
    { orientation: "horizontal", row: br + 1, col: bc },
    { orientation: "vertical", row: br, col: bc },
    { orientation: "vertical", row: br, col: bc + 1 },
  ];

  for (const edge of candidateEdges) {
    let isDrawn: boolean;
    if (edge.orientation === "horizontal") {
      isDrawn = state.horizontalEdges[edge.row][edge.col];
    } else {
      isDrawn = state.verticalEdges[edge.row][edge.col];
    }

    if (!isDrawn) {
      // This edge is adjacent to the target box and undrawn
      return edge;
    }
  }

  return null;
}
