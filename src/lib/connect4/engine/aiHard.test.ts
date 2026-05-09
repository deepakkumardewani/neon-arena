import { describe, expect, it } from "vitest";
import { chooseColumn } from "./aiHard";
import { createInitialState, dropDisc } from "./rules";

describe("aiHard.chooseColumn", () => {
  it("returns a legal column on an empty board", () => {
    const state = { ...createInitialState(), status: "playing" as const };
    const col = chooseColumn(state);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThanOrEqual(6);
  });

  it("takes immediate win when available", () => {
    let state = createInitialState();
    state = { ...dropDisc(state, 0), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 6), status: "playing" as const }; // P2
    state = { ...dropDisc(state, 1), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 6), status: "playing" as const }; // P2
    state = { ...dropDisc(state, 2), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 6), status: "playing" as const }; // P2
    expect(chooseColumn(state)).toBe(3);
  });

  it("blocks a forced loss", () => {
    // P2 builds cols 1,2,3 row0; P1 scattered at 0 and 6 (no win available)
    // P2 threatens col 4 (1,2,3,4 horizontal)
    let state = createInitialState();
    state = { ...dropDisc(state, 0), status: "playing" as const }; // P1 col0 row0
    state = { ...dropDisc(state, 1), status: "playing" as const }; // P2 col1 row0
    state = { ...dropDisc(state, 6), status: "playing" as const }; // P1 col6 row0
    state = { ...dropDisc(state, 2), status: "playing" as const }; // P2 col2 row0
    state = { ...dropDisc(state, 6), status: "playing" as const }; // P1 col6 row1
    state = { ...dropDisc(state, 3), status: "playing" as const }; // P2 col3 row0
    // P1's turn: cannot win; must block P2 at col 4
    expect(chooseColumn(state)).toBe(4);
  });

  it("completes within 1500ms on an empty board at depth 8", () => {
    const state = { ...createInitialState(), status: "playing" as const };
    const start = Date.now();
    chooseColumn(state, { maxDepth: 8 });
    expect(Date.now() - start).toBeLessThan(1500);
  });

  it("respects maxDepth override", () => {
    const state = { ...createInitialState(), status: "playing" as const };
    const col = chooseColumn(state, { maxDepth: 4 });
    expect(col).toBeGreaterThanOrEqual(0);
    expect(col).toBeLessThanOrEqual(6);
  });
});
