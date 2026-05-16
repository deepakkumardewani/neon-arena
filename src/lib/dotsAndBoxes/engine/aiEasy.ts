import type { DotsGameState, EdgeRef } from "../types";
import { listLegalEdges } from "./rules";

export function chooseEdge(state: DotsGameState): EdgeRef {
  const legal = listLegalEdges(state);
  return legal[Math.floor(Math.random() * legal.length)];
}
