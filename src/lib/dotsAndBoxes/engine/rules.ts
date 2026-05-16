import type { BoardSize, BoxRef, DotsGameState, DotsMove, EdgeRef, PlayerId } from "../types";

function createBoolGrid(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

function createNullGrid(rows: number, cols: number): (PlayerId | null)[][] {
  return Array.from({ length: rows }, () =>
    Array.from<PlayerId | null>({ length: cols }).fill(null),
  );
}

export function createInitialState(size: BoardSize): DotsGameState {
  const { rows, cols } = size;
  return {
    horizontalEdges: createBoolGrid(rows + 1, cols),
    verticalEdges: createBoolGrid(rows, cols + 1),
    boxOwner: createNullGrid(rows, cols),
    currentPlayer: 1,
    status: "idle",
    winner: null,
    scores: { 1: 0, 2: 0 },
    hintTokens: 3,
    history: [],
    hoveredEdge: null,
    hintEdge: null,
    lastClaimedBoxes: [],
    size,
  };
}

export function isEdgeDrawn(state: DotsGameState, edge: EdgeRef): boolean {
  if (edge.orientation === "horizontal") {
    return state.horizontalEdges[edge.row][edge.col] === true;
  }
  return state.verticalEdges[edge.row][edge.col] === true;
}

export function listLegalEdges(state: DotsGameState): EdgeRef[] {
  const { rows, cols } = state.size;
  const edges: EdgeRef[] = [];

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!state.horizontalEdges[r][c]) {
        edges.push({ orientation: "horizontal", row: r, col: c });
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols; c++) {
      if (!state.verticalEdges[r][c]) {
        edges.push({ orientation: "vertical", row: r, col: c });
      }
    }
  }

  return edges;
}

export function isBoxComplete(state: DotsGameState, box: BoxRef): boolean {
  const { row: br, col: bc } = box;

  const top = state.horizontalEdges[br][bc];
  const bottom = state.horizontalEdges[br + 1][bc];
  const left = state.verticalEdges[br][bc];
  const right = state.verticalEdges[br][bc + 1];

  return !!(top && bottom && left && right);
}

function setHorizontalEdge(
  state: DotsGameState,
  row: number,
  col: number,
  value: boolean,
): ReadonlyArray<ReadonlyArray<boolean>> {
  return state.horizontalEdges.map((r, ri) =>
    ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r,
  );
}

function setVerticalEdge(
  state: DotsGameState,
  row: number,
  col: number,
  value: boolean,
): ReadonlyArray<ReadonlyArray<boolean>> {
  return state.verticalEdges.map((r, ri) =>
    ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r,
  );
}

function setBoxOwner(
  state: DotsGameState,
  boxRow: number,
  boxCol: number,
  owner: PlayerId,
): ReadonlyArray<ReadonlyArray<PlayerId | null>> {
  return state.boxOwner.map((r, ri) =>
    ri === boxRow ? r.map((c, ci) => (ci === boxCol ? owner : c)) : r,
  );
}

export function claimEdge(state: DotsGameState, edge: EdgeRef): DotsGameState {
  if (isEdgeDrawn(state, edge)) return state;
  if (state.status === "finished") return state;

  const player = state.currentPlayer;
  let newState = state;

  if (edge.orientation === "horizontal") {
    newState = {
      ...newState,
      horizontalEdges: setHorizontalEdge(newState, edge.row, edge.col, true),
    };
  } else {
    newState = {
      ...newState,
      verticalEdges: setVerticalEdge(newState, edge.row, edge.col, true),
    };
  }

  const move: DotsMove = { edge, player };
  newState = {
    ...newState,
    history: [...newState.history, move],
    lastClaimedBoxes: [],
  };

  // Newly completed boxes = complete after this edge but not before (O(rows·cols); max 25).
  // A vertical line at verticalEdges[r][c] borders box (r,c−1) on the right and (r,c) on
  // the left, so a naive “adjacent cells” helper is easy to off-by-one; the diff matches
  // `isBoxComplete` exactly (~1–2 boxes per move).
  const { rows, cols } = newState.size;
  const claimedBoxes: BoxRef[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const box: BoxRef = { row: r, col: c };
      if (!isBoxComplete(newState, box)) continue;
      if (isBoxComplete(state, box)) continue;
      if (state.boxOwner[r][c] !== null) continue;
      claimedBoxes.push(box);
    }
  }

  let newScores = newState.scores;
  let newBoxOwner = newState.boxOwner;

  for (const box of claimedBoxes) {
    newBoxOwner = setBoxOwner({ ...newState, boxOwner: newBoxOwner }, box.row, box.col, player);
    newScores = {
      ...newScores,
      [player]: newScores[player] + 1,
    };
  }

  newState = {
    ...newState,
    boxOwner: newBoxOwner,
    scores: newScores,
    lastClaimedBoxes: claimedBoxes,
  };

  const bonusTurn = claimedBoxes.length > 0;

  if (!bonusTurn) {
    newState = {
      ...newState,
      currentPlayer: player === 1 ? 2 : 1,
    };
  }

  if (newState.status === "idle") {
    newState = { ...newState, status: "playing" };
  }

  if (isGameOver(newState)) {
    newState = {
      ...newState,
      status: "finished",
      winner: computeWinner(newState),
    };
  }

  return newState;
}

export function isGameOver(state: DotsGameState): boolean {
  return listLegalEdges(state).length === 0;
}

export function computeWinner(state: DotsGameState): PlayerId | "draw" | null {
  if (!isGameOver(state)) return null;

  if (state.scores[1] > state.scores[2]) return 1;
  if (state.scores[2] > state.scores[1]) return 2;
  return "draw";
}
