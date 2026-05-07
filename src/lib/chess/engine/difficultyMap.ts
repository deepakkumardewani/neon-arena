export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  readonly skillLevel: number;
  readonly depth: number;
  /** Minimum display delay in ms so AI doesn't feel instant on Easy */
  readonly thinkMs: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { skillLevel: 1, depth: 5, thinkMs: 500 },
  medium: { skillLevel: 8, depth: 10, thinkMs: 1000 },
  hard: { skillLevel: 20, depth: 18, thinkMs: 2000 },
} as const;
