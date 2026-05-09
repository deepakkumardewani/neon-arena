import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { useConnect4Store } from "./useConnect4Store";

function getStore() {
  return useConnect4Store.getState();
}

describe("useConnect4Store", () => {
  beforeEach(() => {
    // Reset store to initial state
    act(() => {
      useConnect4Store.setState({
        state: {
          board: Array.from({ length: 7 }, () => Array(6).fill(null)),
          currentPlayer: 1,
          status: "idle",
          winResult: null,
          isDraw: false,
          history: [],
          hoverCol: null,
          hintCol: null,
          hintTokens: 3,
          animatingDisc: null,
        },
      });
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("dropDisc", () => {
    it("no-ops when status is not playing", () => {
      const before = getStore().state;
      act(() => {
        getStore().dropDisc(3);
      });
      expect(getStore().state.board).toEqual(before.board);
    });

    it("places disc when status is playing", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing" },
        }));
        getStore().dropDisc(3, 0);
      });
      expect(getStore().state.board[3][0]).toBe(1);
    });

    it("no-ops on full column", () => {
      const fullCol = [1, 2, 1, 2, 1, 2] as const;
      act(() => {
        useConnect4Store.setState((s) => ({
          state: {
            ...s.state,
            status: "playing",
            board: s.state.board.map((col, i) => (i === 0 ? [...fullCol] : col)),
          },
        }));
        getStore().dropDisc(0, 0);
      });
      expect(getStore().state.board[0]).toEqual([...fullCol]);
    });

    it("sets animatingDisc on drop and clears after animDuration", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing" },
        }));
        getStore().dropDisc(3, 60);
      });
      // animatingDisc should be set immediately
      expect(getStore().state.animatingDisc).not.toBeNull();

      // After animation duration (5 rows from top to row 0 = 5 * 60 = 300ms)
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(getStore().state.animatingDisc).toBeNull();
    });

    it("clears animatingDisc instantly when animationSpeedMs is 0", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing" },
        }));
        getStore().dropDisc(3, 0);
      });
      expect(getStore().state.animatingDisc).toBeNull();
    });
  });

  describe("requestHint", () => {
    it("no-ops when hintTokens is 0", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing", hintTokens: 0 },
        }));
        getStore().requestHint();
      });
      expect(getStore().state.hintCol).toBeNull();
      expect(getStore().state.hintTokens).toBe(0);
    });

    it("no-ops when status is not playing", () => {
      act(() => {
        getStore().requestHint();
      });
      expect(getStore().state.hintCol).toBeNull();
      expect(getStore().state.hintTokens).toBe(3);
    });

    it("decrements hintTokens and sets hintCol", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing" },
        }));
        getStore().requestHint();
      });
      expect(getStore().state.hintTokens).toBe(2);
      expect(getStore().state.hintCol).toBeGreaterThanOrEqual(0);
    });

    it("auto-clears hintCol after HINT_DISPLAY_MS (3000ms)", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing" },
        }));
        getStore().requestHint();
      });
      expect(getStore().state.hintCol).not.toBeNull();

      act(() => {
        vi.advanceTimersByTime(3001);
      });
      expect(getStore().state.hintCol).toBeNull();
    });
  });

  describe("undoMove", () => {
    it("reverts one move in local mode", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing" },
        }));
        getStore().dropDisc(3, 0);
        getStore().undoMove("local");
      });
      expect(getStore().state.history).toHaveLength(0);
    });
  });

  describe("resetGame", () => {
    it("resets to initial state", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing" },
        }));
        getStore().dropDisc(3, 0);
        getStore().resetGame();
      });
      expect(getStore().state.history).toHaveLength(0);
      expect(getStore().state.status).toBe("idle");
      expect(getStore().state.hintTokens).toBe(3);
    });
  });

  describe("hoverColumn / clearHint", () => {
    it("sets and clears hover", () => {
      act(() => {
        getStore().hoverColumn(4);
      });
      expect(getStore().state.hoverCol).toBe(4);

      act(() => {
        getStore().hoverColumn(null);
      });
      expect(getStore().state.hoverCol).toBeNull();
    });

    it("clearHint nulls hintCol", () => {
      act(() => {
        useConnect4Store.setState((s) => ({
          state: { ...s.state, status: "playing", hintCol: 5 },
        }));
        getStore().clearHint();
      });
      expect(getStore().state.hintCol).toBeNull();
    });
  });
});
