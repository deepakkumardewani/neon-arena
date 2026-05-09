import { chooseColumn } from "./aiHard";
import type { Connect4GameState } from "../types";

export interface WorkerRequest {
  state: Connect4GameState;
  maxDepth?: number;
}

export interface WorkerResponse {
  col: number;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { state, maxDepth } = event.data;
  const col = chooseColumn(state, maxDepth !== undefined ? { maxDepth } : undefined);
  const response: WorkerResponse = { col };
  self.postMessage(response);
};
