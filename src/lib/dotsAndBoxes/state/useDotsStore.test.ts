import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useDotsStore } from "./useDotsStore";

beforeEach(() => {
  useDotsStore.getState().resetGame({ rows: 3, cols: 3 });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDotsStore — claimEdge", () => {
  it("draws an edge and moves to playing", () => {
    useDotsStore.getState().claimEdge({ orientation: "horizontal", row: 0, col: 0 });
    const s = useDotsStore.getState();
    expect(s.status).toBe("playing");
    expect(s.horizontalEdges[0][0]).toBe(true);
  });

  it("no-op on finished game", () => {
    useDotsStore.setState({ status: "finished" });
    useDotsStore.getState().claimEdge({ orientation: "horizontal", row: 0, col: 0 });
    const s = useDotsStore.getState();
    expect(s.horizontalEdges[0][0]).toBe(false);
  });

  it("clears lastClaimedBoxes after 600ms", () => {
    useDotsStore.setState({ lastClaimedBoxes: [{ row: 0, col: 0 }] });
    useDotsStore.getState().claimEdge({ orientation: "horizontal", row: 0, col: 0 });
    vi.advanceTimersByTime(600);
    expect(useDotsStore.getState().lastClaimedBoxes).toHaveLength(0);
  });
});

describe("useDotsStore — requestHint", () => {
  it("decrements hintTokens", () => {
    expect(useDotsStore.getState().hintTokens).toBe(3);
    useDotsStore.getState().requestHint();
    expect(useDotsStore.getState().hintTokens).toBe(2);
  });

  it("no-ops when hintTokens === 0", () => {
    useDotsStore.setState({ hintTokens: 0 });
    useDotsStore.getState().requestHint();
    expect(useDotsStore.getState().hintTokens).toBe(0);
  });

  it("clears hintEdge after HINT_DISPLAY_MS", () => {
    // Need at least a playing state for aiHard to compute
    useDotsStore.setState({ status: "playing" });
    useDotsStore.getState().requestHint();
    vi.advanceTimersByTime(3_000);
    expect(useDotsStore.getState().hintEdge).toBeNull();
  });
});

describe("useDotsStore — undoMove", () => {
  it("reverts after one claim", () => {
    useDotsStore.getState().claimEdge({ orientation: "horizontal", row: 0, col: 0 });
    expect(useDotsStore.getState().history.length).toBe(1);
    useDotsStore.getState().undoMove();
    expect(useDotsStore.getState().history.length).toBe(0);
  });
});

describe("useDotsStore — resetGame", () => {
  it("resets to idle with 3 hint tokens", () => {
    useDotsStore.getState().claimEdge({ orientation: "horizontal", row: 0, col: 0 });
    useDotsStore.setState({ hintTokens: 1 });
    useDotsStore.getState().resetGame();
    const s = useDotsStore.getState();
    expect(s.status).toBe("idle");
    expect(s.hintTokens).toBe(3);
    expect(s.history.length).toBe(0);
  });
});
