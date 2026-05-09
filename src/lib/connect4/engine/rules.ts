import type {
  Board,
  CellValue,
  Connect4GameState,
  Connect4Move,
  PlayerId,
  WinResult,
} from "../types";

const COLS = 7;
const ROWS = 6;
const WIN_LENGTH = 4;

const DIRECTIONS: readonly [number, number][] = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal ↗
  [1, -1], // diagonal ↘
];

function createEmptyBoard(): Board {
  return Array.from({ length: COLS }, () =>
    Array.from<CellValue>({ length: ROWS }).fill(null),
  ) as Board;
}

export function createInitialState(): Connect4GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 1,
    status: "idle",
    winResult: null,
    isDraw: false,
    history: [],
    hoverCol: null,
    hintCol: null,
    hintTokens: 3,
    animatingDisc: null,
  };
}

export function isColumnFull(board: Board, col: number): boolean {
  return board[col].every((cell) => cell !== null);
}

export function listLegalColumns(board: Board): number[] {
  return Array.from({ length: COLS }, (_, i) => i).filter((col) => !isColumnFull(board, col));
}

export function getDropRow(board: Board, col: number): number {
  for (let row = 0; row < ROWS; row++) {
    if (board[col][row] === null) return row;
  }
  return -1;
}

export function checkWin(
  board: Board,
  col: number,
  row: number,
  player: PlayerId,
): WinResult | null {
  for (const [dc, dr] of DIRECTIONS) {
    const cells: [number, number][] = [[col, row]];

    for (const sign of [-1, 1]) {
      let c = col + dc * sign;
      let r = row + dr * sign;
      while (c >= 0 && c < COLS && r >= 0 && r < ROWS && board[c][r] === player) {
        cells.push([c, r]);
        c += dc * sign;
        r += dr * sign;
      }
    }

    if (cells.length >= WIN_LENGTH) {
      return { winner: player, cells: cells.slice(0, WIN_LENGTH) };
    }
  }
  return null;
}

export function checkDraw(board: Board): boolean {
  return board.every((col) => col.every((cell) => cell !== null));
}

function setCell(board: Board, col: number, row: number, value: CellValue): Board {
  return board.map((c, ci) =>
    ci === col ? c.map((cell, ri) => (ri === row ? value : cell)) : c,
  ) as Board;
}

export function dropDisc(state: Connect4GameState, col: number): Connect4GameState {
  if (isColumnFull(state.board, col)) return state;

  const row = getDropRow(state.board, col);
  const player = state.currentPlayer;
  const newBoard = setCell(state.board, col, row, player);

  const move: Connect4Move = { col, row, player };
  const winResult = checkWin(newBoard, col, row, player);

  if (winResult) {
    return {
      ...state,
      board: newBoard,
      status: "finished",
      winResult,
      isDraw: false,
      history: [...state.history, move],
      animatingDisc: { col, fromRow: ROWS - 1, toRow: row, player },
    };
  }

  if (checkDraw(newBoard)) {
    return {
      ...state,
      board: newBoard,
      status: "finished",
      winResult: null,
      isDraw: true,
      history: [...state.history, move],
      animatingDisc: { col, fromRow: ROWS - 1, toRow: row, player },
    };
  }

  return {
    ...state,
    board: newBoard,
    status: "playing",
    currentPlayer: player === 1 ? 2 : 1,
    history: [...state.history, move],
    animatingDisc: { col, fromRow: ROWS - 1, toRow: row, player },
  };
}
