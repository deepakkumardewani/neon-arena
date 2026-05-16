import { describe, it, expect } from "vitest";
import { dotsReducer } from "./dotsReducer";
import { createInitialState } from "../engine/rules";
import type { DotsGameState } from "../types";

const SIZE = { rows: 3, cols: 3 } as const;

function fresh(): DotsGameState {
  return createInitialState(SIZE);
}

describe("dotsReducer — CLAIM_EDGE", () => {
  it("delegates to claimEdge and transitions status to playing", () => {
    const state = fresh();
    const next = dotsReducer(state, {
      type: "CLAIM_EDGE",
      edge: { orientation: "horizontal", row: 0, col: 0 },
    });
    expect(next.status).toBe("playing");
    expect(next.horizontalEdges[0][0]).toBe(true);
  });

  it("no-ops when status is finished", () => {
    const state = { ...fresh(), status: "finished" as const };
    const next = dotsReducer(state, {
      type: "CLAIM_EDGE",
      edge: { orientation: "horizontal", row: 0, col: 0 },
    });
    expect(next).toBe(state);
  });

  it("no-ops on already-drawn edge (returns same ref or equal state)", () => {
    const after = dotsReducer(fresh(), {
      type: "CLAIM_EDGE",
      edge: { orientation: "horizontal", row: 0, col: 0 },
    });
    const again = dotsReducer(after, {
      type: "CLAIM_EDGE",
      edge: { orientation: "horizontal", row: 0, col: 0 },
    });
    // State should be unchanged - same edge stays drawn, no extra history entry
    expect(again.history.length).toBe(after.history.length);
  });
});

describe("dotsReducer — UNDO_MOVE", () => {
  it("no-ops when history is empty", () => {
    const state = fresh();
    const next = dotsReducer(state, { type: "UNDO_MOVE" });
    expect(next.history.length).toBe(0);
    expect(next.status).toBe("idle");
  });

  it("reverts a single move", () => {
    const after = dotsReducer(fresh(), {
      type: "CLAIM_EDGE",
      edge: { orientation: "horizontal", row: 0, col: 0 },
    });
    expect(after.history.length).toBe(1);
    const undone = dotsReducer(after, { type: "UNDO_MOVE" });
    expect(undone.history.length).toBe(0);
    expect(undone.horizontalEdges[0][0]).toBe(false);
    expect(undone.status).toBe("idle");
  });

  it("preserves hintTokens across undo", () => {
    const state = { ...fresh(), hintTokens: 2 };
    const after = dotsReducer(state, {
      type: "CLAIM_EDGE",
      edge: { orientation: "horizontal", row: 0, col: 0 },
    });
    const undone = dotsReducer({ ...after, hintTokens: 2 }, { type: "UNDO_MOVE" });
    expect(undone.hintTokens).toBe(2);
  });
});

describe("dotsReducer — RESET_GAME", () => {
  it("returns fresh state for the given size", () => {
    const played = dotsReducer(fresh(), {
      type: "CLAIM_EDGE",
      edge: { orientation: "horizontal", row: 0, col: 0 },
    });
    const reset = dotsReducer(played, { type: "RESET_GAME", size: SIZE });
    expect(reset.history.length).toBe(0);
    expect(reset.status).toBe("idle");
    expect(reset.hintTokens).toBe(3);
    expect(reset.horizontalEdges[0][0]).toBe(false);
  });

  it("can reset to a different board size", () => {
    const reset = dotsReducer(fresh(), {
      type: "RESET_GAME",
      size: { rows: 5, cols: 5 },
    });
    expect(reset.size).toEqual({ rows: 5, cols: 5 });
    expect(reset.horizontalEdges.length).toBe(6); // rows + 1
  });
});

describe("dotsReducer — HOVER_EDGE", () => {
  it("sets hoveredEdge", () => {
    const edge = { orientation: "horizontal" as const, row: 0, col: 0 };
    const next = dotsReducer(fresh(), { type: "HOVER_EDGE", edge });
    expect(next.hoveredEdge).toEqual(edge);
  });

  it("clears hoveredEdge when null passed", () => {
    const edge = { orientation: "horizontal" as const, row: 0, col: 0 };
    const withHover = dotsReducer(fresh(), { type: "HOVER_EDGE", edge });
    const cleared = dotsReducer(withHover, { type: "HOVER_EDGE", edge: null });
    expect(cleared.hoveredEdge).toBeNull();
  });
});

describe("dotsReducer — SET_HINT / CLEAR_HINT", () => {
  it("sets hintEdge", () => {
    const edge = { orientation: "vertical" as const, row: 1, col: 1 };
    const next = dotsReducer(fresh(), { type: "SET_HINT", edge });
    expect(next.hintEdge).toEqual(edge);
  });

  it("clears hintEdge", () => {
    const edge = { orientation: "vertical" as const, row: 1, col: 1 };
    const withHint = dotsReducer(fresh(), { type: "SET_HINT", edge });
    const cleared = dotsReducer(withHint, { type: "CLEAR_HINT" });
    expect(cleared.hintEdge).toBeNull();
  });
});

describe("dotsReducer — input state immutability", () => {
  it("never mutates the input state object", () => {
    const state = fresh();
    const frozen = Object.freeze(state);
    expect(() =>
      dotsReducer(frozen, {
        type: "CLAIM_EDGE",
        edge: { orientation: "horizontal", row: 0, col: 0 },
      }),
    ).not.toThrow();
  });
});
