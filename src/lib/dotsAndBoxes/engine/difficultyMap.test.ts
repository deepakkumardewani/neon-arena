import { describe, expect, it } from "vite-plus/test";

import { DIFFICULTY_CONFIG } from "./difficultyMap";

describe("difficultyMap", () => {
  it("has config for all three difficulties", () => {
    expect(DIFFICULTY_CONFIG.easy).toBeDefined();
    expect(DIFFICULTY_CONFIG.medium).toBeDefined();
    expect(DIFFICULTY_CONFIG.hard).toBeDefined();
  });

  it("easy has lowest thinkMs and depth", () => {
    const { easy, medium } = DIFFICULTY_CONFIG;
    expect(easy.thinkMs).toBeLessThan(medium.thinkMs);
    expect(easy.maxDepth).toBe(1);
  });

  it("hard has maxDepth of 8", () => {
    expect(DIFFICULTY_CONFIG.hard.maxDepth).toBe(8);
  });

  it("all strategies match their difficulty key", () => {
    expect(DIFFICULTY_CONFIG.easy.strategy).toBe("easy");
    expect(DIFFICULTY_CONFIG.medium.strategy).toBe("medium");
    expect(DIFFICULTY_CONFIG.hard.strategy).toBe("hard");
  });
});
