import type { GameDoc } from "@/types/firebase";

export type { GameDoc };

export interface IGameService {
  createGame(playerX: { uid: string; nickname: string }): Promise<string>;
  joinGame(gameId: string, playerO: { uid: string; nickname: string }): Promise<void>;
  makeMove(gameId: string, cellIndex: number, player: "X" | "O"): Promise<void>;
  subscribeToGame(gameId: string, cb: (game: GameDoc) => void): () => void;
  setDisconnected(gameId: string, uid: string): Promise<void>;
  acceptRematch(gameId: string, uid: string): Promise<string>;
  getGame(gameId: string): Promise<GameDoc | null>;
}
