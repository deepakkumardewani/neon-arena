export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  readonly thinkMs: number;
  readonly strategy: Difficulty;
  readonly maxDepth: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { thinkMs: 400, strategy: "easy", maxDepth: 1 },
  medium: { thinkMs: 600, strategy: "medium", maxDepth: 4 },
  hard: { thinkMs: 800, strategy: "hard", maxDepth: 8 },
};
