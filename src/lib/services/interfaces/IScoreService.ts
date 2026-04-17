import type { ScoreDoc } from "@/types/player";

export type { ScoreDoc };

export interface IScoreService {
  getScore(uid: string): Promise<ScoreDoc | null>;
  incrementScore(uid: string, result: "win" | "loss" | "draw", nickname: string): Promise<void>;
}
