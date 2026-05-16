import type { DotsGameState, EdgeRef } from "../types";
import { chooseEdge } from "./aiHard";

self.onmessage = (e: MessageEvent<DotsGameState>) => {
  const state = e.data;
  const edge: EdgeRef = chooseEdge(state);
  self.postMessage(edge);
};
