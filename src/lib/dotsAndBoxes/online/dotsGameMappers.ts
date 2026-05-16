import type { GameDoc } from "@/types/firebase";
import type { DotsGameState } from "../types";

export interface DotsOnlineDoc {
  readonly horizontalEdges: readonly (readonly boolean[])[];
  readonly verticalEdges: readonly (readonly boolean[])[];
  readonly boxOwner: readonly (readonly (1 | 2 | null)[])[];
  readonly currentPlayer: 1 | 2;
  readonly scores: { readonly 1: number; readonly 2: number };
  readonly history: readonly (readonly [
    orientation: "horizontal" | "vertical",
    row: number,
    col: number,
  ])[];
  readonly status: "idle" | "playing" | "finished";
  readonly winner: 1 | 2 | "draw" | null;
  readonly lastMoveAt: number;
}

/**
 * Maps a Firebase Firestore game document to a DotsGameState.
 * This is used when receiving game updates from the server.
 */
export function docToState(doc: GameDoc): DotsGameState {
  const gameData = doc as unknown as Record<string, unknown>;

  // Extract raw arrays from doc
  const horizontalEdges = (gameData.horizontalEdges as boolean[][]) || [];
  const verticalEdges = (gameData.verticalEdges as boolean[][]) || [];
  const boxOwner = (gameData.boxOwner as (1 | 2 | null)[][]) || [];
  const history = (gameData.history as [string, number, number][]) || [];
  const currentPlayer = (gameData.currentPlayer as 1 | 2) || 1;
  const scores = (gameData.scores as { 1: number; 2: number }) || { 1: 0, 2: 0 };
  const status = (gameData.status as "idle" | "playing" | "finished") || "playing";
  let winner: 1 | 2 | "draw" | null = gameData.winner as any;
  if (winner === undefined || winner === null) {
    winner = null;
  }

  // Determine board size from edges
  const rows = Math.max(horizontalEdges.length - 1, verticalEdges.length);
  const cols = Math.max(horizontalEdges[0]?.length || 0, (verticalEdges[0]?.length || 0) - 1);

  // Convert history array
  const parsedHistory: import("../types").DotsMove[] = history.map((h) => ({
    edge: {
      orientation: h[0] as "horizontal" | "vertical",
      row: h[1],
      col: h[2],
    },
    player: 1, // Infer from position (alternating)
  }));

  return {
    horizontalEdges,
    verticalEdges,
    boxOwner,
    currentPlayer,
    status: status as "idle" | "playing" | "finished",
    winner,
    scores,
    hintTokens: 0, // Not stored online
    history: parsedHistory,
    hoveredEdge: null,
    hintEdge: null,
    lastClaimedBoxes: [],
    size: { rows: (rows + 1) as 3 | 4 | 5, cols: (cols + 1) as 3 | 4 | 5 },
  };
}

/**
 * Maps a DotsGameState back to Firestore patch fields.
 * Returns only the fields that should be written to Firebase.
 */
export function stateToDoc(state: DotsGameState): DotsOnlineDoc {
  // Convert history to serializable format
  const historyArray = state.history.map((h) => [h.edge.orientation, h.edge.row, h.edge.col]);

  return {
    horizontalEdges: state.horizontalEdges as readonly (readonly boolean[])[],
    verticalEdges: state.verticalEdges as readonly (readonly boolean[])[],
    boxOwner: state.boxOwner as readonly (readonly (1 | 2 | null)[])[],
    currentPlayer: state.currentPlayer,
    scores: state.scores,
    history: historyArray as unknown as readonly (readonly [
      "horizontal" | "vertical",
      number,
      number,
    ])[],
    status: state.status,
    winner: state.winner,
    lastMoveAt: Date.now(),
  };
}
