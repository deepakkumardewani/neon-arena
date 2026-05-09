import { describe, expect, it, vi } from "vitest";
import { chooseColumn } from "./ai";
import { createInitialState } from "./rules";

vi.mock("./aiEasy", () => ({ chooseColumn: vi.fn(() => 0) }));
vi.mock("./aiMedium", () => ({ chooseColumn: vi.fn(() => 1) }));
vi.mock("./aiHard", () => ({ chooseColumn: vi.fn(() => 2) }));

describe("ai router", () => {
  const state = { ...createInitialState(), status: "playing" as const };

  it("routes easy to aiEasy", async () => {
    const { chooseColumn: easy } = await import("./aiEasy");
    chooseColumn(state, "easy");
    expect(easy).toHaveBeenCalledWith(state);
  });

  it("routes medium to aiMedium", async () => {
    const { chooseColumn: medium } = await import("./aiMedium");
    chooseColumn(state, "medium");
    expect(medium).toHaveBeenCalledWith(state);
  });

  it("routes hard to aiHard", async () => {
    const { chooseColumn: hard } = await import("./aiHard");
    chooseColumn(state, "hard", { maxDepth: 6 });
    expect(hard).toHaveBeenCalledWith(state, { maxDepth: 6 });
  });
});
