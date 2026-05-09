import { describe, it, expect } from "vitest";
import { HINT_TOKENS_PER_GAME, AUTO_HINT_INACTIVITY_MS, HINT_DISPLAY_MS } from "./hintConfig";

describe("hintConfig", () => {
  it("exports correct HINT_TOKENS_PER_GAME", () => {
    expect(HINT_TOKENS_PER_GAME).toBe(3);
  });

  it("exports correct AUTO_HINT_INACTIVITY_MS", () => {
    expect(AUTO_HINT_INACTIVITY_MS).toBe(30_000);
  });

  it("exports correct HINT_DISPLAY_MS", () => {
    expect(HINT_DISPLAY_MS).toBe(3_000);
  });
});
