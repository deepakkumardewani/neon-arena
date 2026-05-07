import { describe, expect, it } from "vitest";
import { computeMaterialDelta } from "./materialCount";

describe("computeMaterialDelta", () => {
  it("returns 0 when no pieces captured", () => {
    expect(computeMaterialDelta([], [])).toBe(0);
  });

  it("returns +3 when white captured a bishop and black captured nothing", () => {
    expect(computeMaterialDelta(["bishop"], [])).toBe(3);
  });

  it("returns -5 when black captured a rook and white captured nothing", () => {
    expect(computeMaterialDelta([], ["rook"])).toBe(-5);
  });

  it("returns 0 when captured material is equal on both sides", () => {
    expect(computeMaterialDelta(["pawn", "knight"], ["bishop", "pawn"])).toBe(0);
  });

  it("sums correctly across mixed piece types", () => {
    // white captured: pawn(1) + knight(3) + queen(9) = 13
    // black captured: rook(5) + bishop(3) = 8
    // delta = 13 - 8 = 5
    expect(computeMaterialDelta(["pawn", "knight", "queen"], ["rook", "bishop"])).toBe(5);
  });
});
