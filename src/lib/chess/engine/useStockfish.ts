import { useCallback, useEffect, useRef, useState } from "react";
import type { Difficulty } from "./difficultyMap";
import { DIFFICULTY_CONFIG } from "./difficultyMap";
import type { WorkerIncoming, WorkerOutgoing } from "./stockfish.worker";

const HINT_DEPTH = 12;

interface UseStockfishOptions {
  fen: string;
  difficulty: Difficulty;
  /** false when it is the human's turn or the game is over */
  enabled: boolean;
  onMove: (uciMove: string) => void;
  onHintMove?: (uciMove: string) => void;
}

interface UseStockfishResult {
  isThinking: boolean;
  /** Request a hint at depth 12 for the given FEN. Deducts no tokens — caller handles that. */
  requestHint: (fen: string) => void;
  /** Reset engine state between games */
  resetEngine: () => void;
}

type PendingRequest = "ai" | "hint";

/**
 * Manages the Stockfish Web Worker lifecycle.
 * Creates the worker lazily (only when `enabled` first becomes true) to avoid
 * loading the ~7 MB WASM bundle in non-solo modes.
 *
 * Supports both AI move requests and one-off hint requests at depth 12.
 * The worker is sequential — we track which request is pending to route the
 * bestmove response to the correct callback.
 */
export function useStockfish({
  fen,
  difficulty,
  enabled,
  onMove,
  onHintMove,
}: UseStockfishOptions): UseStockfishResult {
  const [isThinking, setIsThinking] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const onMoveRef = useRef(onMove);
  const onHintMoveRef = useRef(onHintMove);
  onMoveRef.current = onMove;
  onHintMoveRef.current = onHintMove;

  const thinkStartRef = useRef<number>(0);
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  const pendingRequestRef = useRef<PendingRequest | null>(null);

  const getOrCreateWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL("./stockfish.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (e: MessageEvent<WorkerOutgoing>) => {
      const msg = e.data;
      if (msg.type !== "bestmove") return;

      const requestType = pendingRequestRef.current;
      pendingRequestRef.current = null;

      if (requestType === "hint") {
        setIsThinking(false);
        onHintMoveRef.current?.(msg.move);
        return;
      }

      // AI move — enforce minimum display delay
      const config = DIFFICULTY_CONFIG[difficultyRef.current];
      const elapsed = Date.now() - thinkStartRef.current;
      const remaining = Math.max(0, config.thinkMs - elapsed);

      setTimeout(() => {
        setIsThinking(false);
        onMoveRef.current(msg.move);
      }, remaining);
    };

    worker.onerror = (err) => {
      console.error("[useStockfish] worker error:", err);
      setIsThinking(false);
      pendingRequestRef.current = null;
    };

    workerRef.current = worker;
    return worker;
  }, []);

  // Send AI position to worker when it becomes the AI's turn.
  useEffect(() => {
    if (!enabled) return;

    const worker = getOrCreateWorker();
    const config = DIFFICULTY_CONFIG[difficulty];
    const msg: WorkerIncoming = {
      type: "position",
      fen,
      depth: config.depth,
      skillLevel: config.skillLevel,
    };

    thinkStartRef.current = Date.now();
    pendingRequestRef.current = "ai";
    setIsThinking(true);
    worker.postMessage(msg);
  }, [enabled, fen, difficulty, getOrCreateWorker]);

  const requestHint = useCallback(
    (hintFen: string) => {
      const worker = getOrCreateWorker();
      const msg: WorkerIncoming = {
        type: "position",
        fen: hintFen,
        depth: HINT_DEPTH,
        skillLevel: DIFFICULTY_CONFIG[difficultyRef.current].skillLevel,
      };
      pendingRequestRef.current = "hint";
      worker.postMessage(msg);
    },
    [getOrCreateWorker],
  );

  const resetEngine = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const msg: WorkerIncoming = { type: "ucinewgame" };
    worker.postMessage(msg);
    setIsThinking(false);
    pendingRequestRef.current = null;
  }, []);

  // Terminate worker on unmount to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "quit" } satisfies WorkerIncoming);
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return { isThinking, requestHint, resetEngine };
}
