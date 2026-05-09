import { describe, expect, it } from "vitest";
import { chooseColumn } from "./aiMedium";
import { createInitialState, dropDisc } from "./rules";

describe("aiMedium.chooseColumn", () => {
  it("wins immediately when available", () => {
    // P1: cols 0,1,2 → wins at col 3
    let state = createInitialState();
    state = { ...dropDisc(state, 0), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 6), status: "playing" as const }; // P2
    state = { ...dropDisc(state, 1), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 6), status: "playing" as const }; // P2
    state = { ...dropDisc(state, 2), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 6), status: "playing" as const }; // P2
    // P1's turn — wins at col 3
    expect(chooseColumn(state)).toBe(3);
  });

  it("blocks opponent immediate win when AI cannot win", () => {
    // P2 builds cols 1,2,3 row 0; P1 scattered at 0 and 6 (can't win)
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

  it("prefers center column when no threat", () => {
    const state = { ...createInitialState(), status: "playing" as const };
    expect(chooseColumn(state)).toBe(3);
  });

  it("win takes priority over block", () => {
    // P1 can win at col 3 (cols 0,1,2); P2 also threatens elsewhere
    let state = createInitialState();
    state = { ...dropDisc(state, 0), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 4), status: "playing" as const }; // P2
    state = { ...dropDisc(state, 1), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 5), status: "playing" as const }; // P2
    state = { ...dropDisc(state, 2), status: "playing" as const }; // P1
    state = { ...dropDisc(state, 5), status: "playing" as const }; // P2 row1 at col5
    // P1 can win at col 3 (horizontal 0,1,2,3); that takes priority
    expect(chooseColumn(state)).toBe(3);
  });
});
