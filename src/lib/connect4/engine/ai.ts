import { chooseColumn as easyChoose } from "./aiEasy";
import { chooseColumn as mediumChoose } from "./aiMedium";
import { chooseColumn as hardChoose } from "./aiHard";
import type { Difficulty } from "./difficultyMap";
import type { Connect4GameState } from "../types";

export function chooseColumn(
  state: Connect4GameState,
  difficulty: Difficulty,
  opts?: { maxDepth?: number },
): number {
  switch (difficulty) {
    case "easy":
      return easyChoose(state);
    case "medium":
      return mediumChoose(state);
    case "hard":
      return hardChoose(state, opts);
  }
}
