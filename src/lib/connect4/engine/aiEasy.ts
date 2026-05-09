import { listLegalColumns } from "./rules";
import type { Connect4GameState } from "../types";

export function chooseColumn(state: Connect4GameState): number {
  const legal = listLegalColumns(state.board);
  return legal[Math.floor(Math.random() * legal.length)];
}
