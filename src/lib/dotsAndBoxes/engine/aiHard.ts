import type { DotsGameState, EdgeRef } from "../types";
import { listLegalEdges, claimEdge } from "./rules";
import { detectChains, chainLength } from "./chainAnalysis";

const DEFAULT_MAX_DEPTH = 8;
const HINT_MAX_DEPTH = 6;
const TOP_CANDIDATES = 6;
const MAX_NODES = 200_000;

let nodesVisited = 0;

interface ChooseEdgeOptions {
  readonly maxDepth?: number;
}

function evaluate(state: DotsGameState, aiPlayer: 1 | 2): number {
  const oppPlayer = aiPlayer === 1 ? 2 : 1;
  const totalBoxes = state.size.rows * state.size.cols;
  const scoreDiff = state.scores[aiPlayer] - state.scores[oppPlayer];

  if (state.status === "finished") return scoreDiff * totalBoxes;

  const chains = detectChains(state);
  let chainBonus = 0;

  for (const chain of chains) {
    const len = chainLength(chain);
    if (len >= 3) {
      chainBonus += state.currentPlayer === aiPlayer ? -len * 0.3 : len * 0.3;
    }
  }

  return scoreDiff + chainBonus;
}

function orderMoves(state: DotsGameState, edges: EdgeRef[]): EdgeRef[] {
  const doubleCompleting: EdgeRef[] = [];
  const completing: EdgeRef[] = [];
  const safe: EdgeRef[] = [];
  const loony: EdgeRef[] = [];

  for (const edge of edges) {
    const completeCount = wouldCompleteAdjacentBoxes(state, edge);
    if (completeCount >= 2) {
      doubleCompleting.push(edge);
    } else if (completeCount === 1) {
      completing.push(edge);
    } else if (isEdgeSafe(state, edge)) {
      safe.push(edge);
    } else {
      loony.push(edge);
    }
  }

  return [...doubleCompleting, ...completing, ...safe, ...loony];
}

function wouldCompleteAdjacentBoxes(state: DotsGameState, edge: EdgeRef): number {
  const { rows, cols } = state.size;
  let count = 0;

  if (edge.orientation === "horizontal") {
    if (edge.row > 0 && boxWouldComplete(state, { row: edge.row - 1, col: edge.col }, edge))
      count++;
    if (edge.row < rows && boxWouldComplete(state, { row: edge.row, col: edge.col }, edge)) count++;
  } else {
    if (edge.col > 0 && boxWouldComplete(state, { row: edge.row, col: edge.col - 1 }, edge))
      count++;
    if (edge.col < cols && boxWouldComplete(state, { row: edge.row, col: edge.col }, edge)) count++;
  }

  return count;
}

function boxWouldComplete(
  state: DotsGameState,
  box: { row: number; col: number },
  edge: EdgeRef,
): boolean {
  if (state.boxOwner[box.row][box.col] !== null) return false;

  const { row: br, col: bc } = box;
  const sides: EdgeRef[] = [
    { orientation: "horizontal", row: br, col: bc },
    { orientation: "horizontal", row: br + 1, col: bc },
    { orientation: "vertical", row: br, col: bc },
    { orientation: "vertical", row: br, col: bc + 1 },
  ];

  let drawn = 0;
  for (const s of sides) {
    if (edgesEqual(s, edge)) continue;
    if (s.orientation === "horizontal" && state.horizontalEdges[s.row][s.col]) drawn++;
    if (s.orientation === "vertical" && state.verticalEdges[s.row][s.col]) drawn++;
  }

  return drawn === 3;
}

function isEdgeSafe(state: DotsGameState, edge: EdgeRef): boolean {
  const { rows, cols } = state.size;

  const checkBox = (boxRow: number, boxCol: number): boolean => {
    if (state.boxOwner[boxRow][boxCol] !== null) return true;

    const sides: EdgeRef[] = [
      { orientation: "horizontal", row: boxRow, col: boxCol },
      { orientation: "horizontal", row: boxRow + 1, col: boxCol },
      { orientation: "vertical", row: boxRow, col: boxCol },
      { orientation: "vertical", row: boxRow, col: boxCol + 1 },
    ];

    let drawn = 0;
    for (const s of sides) {
      if (edgesEqual(s, edge)) continue;
      if (s.orientation === "horizontal" && state.horizontalEdges[s.row][s.col]) drawn++;
      if (s.orientation === "vertical" && state.verticalEdges[s.row][s.col]) drawn++;
    }

    return drawn < 2;
  };

  if (edge.orientation === "horizontal") {
    if (edge.row > 0 && !checkBox(edge.row - 1, edge.col)) return false;
    if (edge.row < rows && !checkBox(edge.row, edge.col)) return false;
  } else {
    if (edge.col > 0 && !checkBox(edge.row, edge.col - 1)) return false;
    if (edge.col < cols && !checkBox(edge.row, edge.col)) return false;
  }

  return true;
}

function edgesEqual(a: EdgeRef, b: EdgeRef): boolean {
  return a.orientation === b.orientation && a.row === b.row && a.col === b.col;
}

function minimax(
  state: DotsGameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: 1 | 2,
): number {
  nodesVisited++;
  if (nodesVisited > MAX_NODES || depth <= 0 || state.status === "finished") {
    return evaluate(state, aiPlayer);
  }

  const legal = listLegalEdges(state);
  if (legal.length === 0) {
    return evaluate(state, aiPlayer);
  }

  const ordered = orderMoves(state, legal);
  // Use fewer candidates at deeper depths for faster search
  const width = Math.min(5, 2 + depth, ordered.length);
  const candidates = ordered.slice(0, width);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const edge of candidates) {
      const newState = claimEdge(state, edge);
      const bonusTurn = newState.currentPlayer === state.currentPlayer;
      const nextDepth = bonusTurn ? depth : depth - 1;
      const nextMaximizing = bonusTurn ? isMaximizing : newState.currentPlayer === aiPlayer;

      const evalScore = minimax(newState, nextDepth, alpha, beta, nextMaximizing, aiPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const edge of candidates) {
      const newState = claimEdge(state, edge);
      const bonusTurn = newState.currentPlayer === state.currentPlayer;
      const nextDepth = bonusTurn ? depth : depth - 1;
      const nextMaximizing = bonusTurn ? isMaximizing : newState.currentPlayer === aiPlayer;

      const evalScore = minimax(newState, nextDepth, alpha, beta, nextMaximizing, aiPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function chooseEdge(state: DotsGameState, options?: ChooseEdgeOptions): EdgeRef {
  const aiPlayer = state.currentPlayer;
  const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
  const legal = listLegalEdges(state);
  const orderedMoves = orderMoves(state, legal);
  const candidates = orderedMoves.slice(0, TOP_CANDIDATES);

  let bestEdge = candidates[0];
  let bestScore = -Infinity;

  for (const edge of candidates) {
    nodesVisited = 0;
    const newState = claimEdge(state, edge);
    const bonusTurn = newState.currentPlayer === state.currentPlayer;
    const nextDepth = bonusTurn ? maxDepth : maxDepth - 1;
    const nextMaximizing = bonusTurn ? true : false;

    const score = minimax(newState, nextDepth, -Infinity, Infinity, nextMaximizing, aiPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestEdge = edge;
    }
  }

  return bestEdge;
}

export function chooseEdgeHint(state: DotsGameState): EdgeRef {
  return chooseEdge(state, { maxDepth: HINT_MAX_DEPTH });
}
