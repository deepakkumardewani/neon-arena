export type GameMode = "solo" | "local" | "online" | "friend";

export type Difficulty = "easy" | "medium" | "hard";

export type BoardCell = "X" | "O" | null;

export type GameStatus = "idle" | "playing" | "win" | "draw";

export interface WinResult {
  readonly winner: "X" | "O";
  readonly line: readonly number[];
}
