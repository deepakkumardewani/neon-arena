import { describe, expect, it } from "vite-plus/test";

import { computeAiMove } from "./ai";
import { createInitialState, listLegalEdges } from "./rules";
import type { BoardSize } from "../types";

function size3x3(): BoardSize {
  return { rows: 3, cols: 3 };
}

describe("ai router", () => {
  it("returns a legal edge for easy difficulty", async () => {
    const state = createInitialState(size3x3());
    const edge = await computeAiMove(state, "easy");
    expect(listLegalEdges(state)).toContainEqual(edge);
  });

  it("returns a legal edge for medium difficulty", async () => {
    const state = createInitialState(size3x3());
    const edge = await computeAiMove(state, "medium");
    expect(listLegalEdges(state)).toContainEqual(edge);
  });

  it("returns a legal edge for hard difficulty", async () => {
    const state = createInitialState(size3x3());
    const edge = await computeAiMove(state, "hard");
    expect(listLegalEdges(state)).toContainEqual(edge);
  });
});
