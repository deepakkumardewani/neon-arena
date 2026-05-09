import { useEffect, useRef, useState } from "react";
import { DIFFICULTY_CONFIG, type Difficulty } from "./difficultyMap";
import { chooseColumn } from "./ai";
import type { Connect4GameState } from "../types";

interface UseConnect4AIOptions {
  onDropDisc: (col: number) => void;
  isPlayerTurn: boolean;
}

export function useConnect4AI(
  state: Connect4GameState,
  difficulty: Difficulty,
  { onDropDisc, isPlayerTurn }: UseConnect4AIOptions,
): { isThinking: boolean } {
  const [isThinking, setIsThinking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (isPlayerTurn || state.status !== "playing") return;

    const config = DIFFICULTY_CONFIG[difficulty];
    setIsThinking(true);

    if (difficulty === "hard") {
      const worker = new Worker(new URL("./ai.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent<{ col: number }>) => {
        const remaining = config.thinkMs;
        timerRef.current = setTimeout(() => {
          setIsThinking(false);
          onDropDisc(event.data.col);
        }, remaining);
      };

      worker.postMessage({ state, maxDepth: config.maxDepth });
    } else {
      const col = chooseColumn(state, difficulty);
      timerRef.current = setTimeout(() => {
        setIsThinking(false);
        onDropDisc(col);
      }, config.thinkMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setIsThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.history.length, isPlayerTurn, state.status, difficulty]);

  return { isThinking };
}
