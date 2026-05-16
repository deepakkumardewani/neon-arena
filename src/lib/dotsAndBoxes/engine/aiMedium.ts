import type { BoxRef, DotsGameState, EdgeRef } from "../types";
import { listLegalEdges } from "./rules";
import { detectChains } from "./chainAnalysis";

function edgesEqual(a: EdgeRef, b: EdgeRef): boolean {
  return a.orientation === b.orientation && a.row === b.row && a.col === b.col;
}

function adjacentBoxes(state: DotsGameState, edge: EdgeRef): BoxRef[] {
  const { rows, cols } = state.size;
  const boxes: BoxRef[] = [];

  if (edge.orientation === "horizontal") {
    if (edge.row > 0) boxes.push({ row: edge.row - 1, col: edge.col });
    if (edge.row < rows) boxes.push({ row: edge.row, col: edge.col });
  } else {
    if (edge.col > 0) boxes.push({ row: edge.row, col: edge.col - 1 });
    if (edge.col < cols) boxes.push({ row: edge.row, col: edge.col });
  }

  return boxes;
}

function drawnSidesExcluding(state: DotsGameState, box: BoxRef, edge: EdgeRef): number {
  const { row: br, col: bc } = box;
  let count = 0;

  const top: EdgeRef = { orientation: "horizontal", row: br, col: bc };
  const bottom: EdgeRef = { orientation: "horizontal", row: br + 1, col: bc };
  const left: EdgeRef = { orientation: "vertical", row: br, col: bc };
  const right: EdgeRef = { orientation: "vertical", row: br, col: bc + 1 };

  if (!edgesEqual(top, edge) && state.horizontalEdges[br][bc]) count++;
  if (!edgesEqual(bottom, edge) && state.horizontalEdges[br + 1][bc]) count++;
  if (!edgesEqual(left, edge) && state.verticalEdges[br][bc]) count++;
  if (!edgesEqual(right, edge) && state.verticalEdges[br][bc + 1]) count++;

  return count;
}

function wouldCompleteBoxCount(state: DotsGameState, edge: EdgeRef): number {
  return adjacentBoxes(state, edge).filter((box) => {
    if (state.boxOwner[box.row][box.col] !== null) return false;
    return drawnSidesExcluding(state, box, edge) === 3;
  }).length;
}

function isSafe(state: DotsGameState, edge: EdgeRef): boolean {
  return adjacentBoxes(state, edge).every((box) => {
    if (state.boxOwner[box.row][box.col] !== null) return true;
    // Safe = doesn't create a 3-sided box (edge is not the 3rd side)
    return drawnSidesExcluding(state, box, edge) < 2;
  });
}

export function chooseEdge(state: DotsGameState): EdgeRef {
  const legal = listLegalEdges(state);

  // Priority 1: complete 2 boxes
  for (const edge of legal) {
    if (wouldCompleteBoxCount(state, edge) === 2) return edge;
  }

  // Priority 2: complete 1 box
  for (const edge of legal) {
    if (wouldCompleteBoxCount(state, edge) === 1) return edge;
  }

  // Priority 3: safe edge
  const safeEdges = legal.filter((edge) => isSafe(state, edge));
  if (safeEdges.length > 0) {
    return safeEdges[Math.floor(Math.random() * safeEdges.length)];
  }

  // Priority 4: sacrifice the shortest chain
  const chains = detectChains(state);
  if (chains.length > 0) {
    chains.sort((a, b) => a.length - b.length);
    const shortestChain = chains[0];
    // Find an edge that belongs to the shortest chain
    for (const box of shortestChain) {
      const { row: br, col: bc } = box;
      const boxEdges: EdgeRef[] = [
        { orientation: "horizontal", row: br, col: bc },
        { orientation: "horizontal", row: br + 1, col: bc },
        { orientation: "vertical", row: br, col: bc },
        { orientation: "vertical", row: br, col: bc + 1 },
      ];
      for (const e of boxEdges) {
        if (legal.some((l) => edgesEqual(l, e))) {
          return e;
        }
      }
    }
  }

  // Fallback: random
  return legal[Math.floor(Math.random() * legal.length)];
}
