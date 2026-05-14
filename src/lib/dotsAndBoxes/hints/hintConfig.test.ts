import { describe, expect, it } from "vitest";
import { AUTO_HINT_INACTIVITY_MS, HINT_DISPLAY_MS, HINT_TOKENS_PER_GAME } from "./hintConfig";

describe("hintConfig", () => {
  it("exports HINT_TOKENS_PER_GAME = 3", () => {
    expect(HINT_TOKENS_PER_GAME).toBe(3);
  });

  it("exports AUTO_HINT_INACTIVITY_MS = 30000", () => {
    expect(AUTO_HINT_INACTIVITY_MS).toBe(30_000);
  });

  it("exports HINT_DISPLAY_MS = 3000", () => {
    expect(HINT_DISPLAY_MS).toBe(3_000);
  });
});
