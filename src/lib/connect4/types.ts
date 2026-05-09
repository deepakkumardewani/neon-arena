export type PlayerId = 1 | 2;

export type CellValue = PlayerId | null;

export type Board = readonly (readonly CellValue[])[];

export interface Connect4Move {
  readonly col: number;
  readonly row: number;
  readonly player: PlayerId;
}

export interface WinResult {
  readonly winner: PlayerId;
  readonly cells: readonly [number, number][];
}

export type Connect4Status = "idle" | "playing" | "finished";

export interface AnimatingDisc {
  readonly col: number;
  readonly fromRow: number;
  readonly toRow: number;
  readonly player: PlayerId;
}

export interface Connect4GameState {
  readonly board: Board;
  readonly currentPlayer: PlayerId;
  readonly status: Connect4Status;
  readonly winResult: WinResult | null;
  readonly isDraw: boolean;
  readonly history: readonly Connect4Move[];
  readonly hoverCol: number | null;
  readonly hintCol: number | null;
  readonly hintTokens: number;
  readonly animatingDisc: AnimatingDisc | null;
}

export interface Connect4Settings {
  readonly showLastMove: boolean;
  readonly allowUndo: boolean;
  readonly hintsEnabled: boolean;
  readonly autoHintDelayMs: number;
  readonly animationSpeedMs: number;
}
