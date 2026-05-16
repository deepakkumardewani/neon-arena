import type { Difficulty } from "./difficultyMap";
import type { DotsGameState, EdgeRef } from "../types";
import { chooseEdge as chooseEasy } from "./aiEasy";
import { chooseEdge as chooseMedium } from "./aiMedium";
import { chooseEdge as chooseHard } from "./aiHard";

export function computeAiMove(state: DotsGameState, difficulty: Difficulty): Promise<EdgeRef> {
  switch (difficulty) {
    case "easy":
      return Promise.resolve(chooseEasy(state));
    case "medium":
      return Promise.resolve(chooseMedium(state));
    case "hard":
      return dispatchHardWorker(state);
  }
}

function dispatchHardWorker(state: DotsGameState): Promise<EdgeRef> {
  if (typeof Worker === "undefined") {
    // Worker not available (e.g., test environment) — run inline
    return Promise.resolve(chooseHard(state));
  }

  return new Promise((resolve) => {
    try {
      const worker = new Worker(new URL("./ai.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent<EdgeRef>) => {
        resolve(e.data);
        worker.terminate();
      };
      worker.onerror = () => {
        worker.terminate();
        resolve(chooseHard(state));
      };
      worker.postMessage(state);
    } catch {
      resolve(chooseHard(state));
    }
  });
}
