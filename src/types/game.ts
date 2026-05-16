export type GameMode = "solo" | "local" | "online" | "friend";

export interface GameConfig {
  readonly gameType: string;
  readonly title: string;
  readonly description: string;
  readonly routePrefix: string;
  readonly modes: readonly GameMode[];
}

export type Difficulty = "easy" | "medium" | "hard";

export type BoardCell = "X" | "O" | null;

export type GameStatus = "idle" | "playing" | "win" | "draw";

export type GameType = "tictactoe" | "chess" | "connect4" | "dots-and-boxes";

export interface WinResult {
  readonly winner: "X" | "O";
  readonly line: readonly number[];
}
