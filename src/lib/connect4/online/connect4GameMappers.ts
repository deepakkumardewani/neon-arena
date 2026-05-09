import type { GameDoc } from "@/types/firebase";
import type { Connect4GameState, Connect4Move, WinResult, PlayerId, CellValue } from "../types";

// ── Firebase document shape for Connect 4 ────────────────────────────────────────

export interface Connect4OnlineDoc {
  readonly c4board: readonly (readonly number[])[];
  readonly c4history: readonly { col: number; row: number; player: number }[];
  readonly c4winCells: readonly [number, number][] | null;
}

export interface Connect4CommitPayload {
  readonly c4board: readonly (readonly number[])[];
  readonly c4history: readonly { col: number; row: number; player: number }[];
  readonly currentTurn: string;
  readonly c4winCells: readonly [number, number][] | null;
  readonly lastMoveAt: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function cellToNum(v: CellValue): number {
  if (v === 1) return 1;
  if (v === 2) return 2;
  return 0;
}

function numToCell(n: unknown): CellValue {
  if (n === 1) return 1;
  if (n === 2) return 2;
  return null;
}

function readBoard(raw: unknown): CellValue[][] {
  if (!Array.isArray(raw)) return [];
  return raw.map((col: unknown) => {
    if (!Array.isArray(col)) return [];
    return col.map((c: unknown) => numToCell(c));
  });
}

function readHistory(raw: unknown): Connect4Move[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m: unknown): m is { col: number; row: number; player: number } =>
        typeof m === "object" &&
        m !== null &&
        typeof (m as Record<string, unknown>).col === "number" &&
        typeof (m as Record<string, unknown>).row === "number" &&
        ((m as Record<string, unknown>).player === 1 ||
          (m as Record<string, unknown>).player === 2),
    )
    .map((m) => ({ col: m.col, row: m.row, player: m.player as PlayerId }));
}

function readWinCells(raw: unknown): [number, number][] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const cells: [number, number][] = [];
  for (const c of raw) {
    if (
      Array.isArray(c) &&
      c.length === 2 &&
      typeof c[0] === "number" &&
      typeof c[1] === "number"
    ) {
      cells.push([c[0], c[1]]);
    }
  }
  return cells.length > 0 ? cells : null;
}

function serializeBoard(board: readonly (readonly CellValue[])[]): readonly (readonly number[])[] {
  return board.map((col) => col.map(cellToNum));
}

function serializeHistory(history: readonly Connect4Move[]): readonly {
  col: number;
  row: number;
  player: number;
}[] {
  return history.map((m) => ({ col: m.col, row: m.row, player: m.player }));
}

// ── Public API ──────────────────────────────────────────────────────────────────

export function docToState(doc: GameDoc): Connect4GameState {
  const data = doc as unknown as Record<string, unknown>;
  const board = readBoard(data.c4board);
  const history = readHistory(data.c4history);
  const winCells = readWinCells(data.c4winCells);

  const hasBoard = board.length === 7 && board.every((col) => col.length === 6);

  // Derive status from doc
  let status: Connect4GameState["status"] = "idle";
  if (doc.status === "active") status = "playing";
  else if (doc.status === "finished") status = "finished";
  else if (doc.status === "waiting") status = "idle";

  // Derive winResult
  let winResult: WinResult | null = null;
  if (doc.winner !== null && doc.winner !== "draw" && winCells !== null && winCells.length > 0) {
    // Winner is stored as player identity string — determine PlayerId from the last move
    const lastMove = history.length > 0 ? history[history.length - 1] : null;
    const winner: PlayerId = lastMove?.player ?? 1;
    winResult = { winner, cells: winCells };
  }

  const isDraw = doc.winner === "draw";

  // Derive currentPlayer — from last move's opponent
  let currentPlayer: PlayerId = 1;
  if (history.length > 0) {
    const lastMove = history[history.length - 1];
    currentPlayer = lastMove.player === 1 ? 2 : 1;
  }

  // If game is finished, currentPlayer stays on the winner/loser (doesn't matter)
  if (status === "finished") {
    currentPlayer = winResult?.winner ?? currentPlayer;
  }

  return {
    board: hasBoard ? (board as unknown as Connect4GameState["board"]) : [],
    currentPlayer,
    status,
    winResult,
    isDraw,
    history,
    hoverCol: null,
    hintCol: null,
    hintTokens: 3,
    animatingDisc: null,
  };
}

export function stateToDoc(
  state: Connect4GameState,
  move: Connect4Move,
): Connect4CommitPayload {
  return {
    c4board: serializeBoard(state.board),
    c4history: serializeHistory(state.history),
    currentTurn: move.player === 1 ? "player2" : "player1", // Toggle turn
    c4winCells: state.winResult?.cells ?? null,
    lastMoveAt: Date.now(),
  };
}

export function buildCommitPayload(
  state: Connect4GameState,
  nextTurn: string,
): Connect4CommitPayload {
  return {
    c4board: serializeBoard(state.board),
    c4history: serializeHistory(state.history),
    currentTurn: nextTurn,
    c4winCells: state.winResult?.cells ?? null,
    lastMoveAt: Date.now(),
  };
}
