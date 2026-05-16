import { useState, useEffect } from "react";
import type { DotsGameState } from "../types";
import type { Difficulty } from "./difficultyMap";
import { DIFFICULTY_CONFIG } from "./difficultyMap";
import { computeAiMove } from "./ai";

export interface UseDotsAIOptions {
  readonly state: DotsGameState;
  readonly difficulty: Difficulty;
  readonly isAiTurn: boolean;
  readonly claimEdge: (edge: import("../types").EdgeRef) => void;
}

export function useDotsAI({ state, difficulty, isAiTurn, claimEdge }: UseDotsAIOptions): {
  isThinking: boolean;
} {
  const [isThinking, setIsThinking] = useState(false);

  // Depends on `history.length`: bonus turns keep `currentPlayer` on the AI, so we must
  // re-schedule after each move or solo mode freezes mid-chain. `state` is omitted from
  // deps because the parent holds the full dots store — including it would retrigger on
  // hover; `history.length` ties scheduling to real moves (state is fresh on that render).
  useEffect(() => {
    if (!isAiTurn || state.status !== "playing") {
      return;
    }

    let cancelled = false;
    setIsThinking(true);

    const config = DIFFICULTY_CONFIG[difficulty];
    const timer = setTimeout(() => {
      if (cancelled) return;
      void computeAiMove(state, difficulty)
        .then((edge) => {
          if (cancelled) return;
          claimEdge(edge);
        })
        .finally(() => {
          if (!cancelled) {
            setIsThinking(false);
          }
        });
    }, config.thinkMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setIsThinking(false);
    };
  }, [state.history.length, state.currentPlayer, state.status, isAiTurn, difficulty, claimEdge]);

  return { isThinking };
}
