import { beforeEach, describe, expect, it } from "vite-plus/test";

import { useGameStore } from "@/hooks/useGameStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import type { ScoreDoc } from "@/types/player";

const emptyScore = (): ScoreDoc => ({
  uid: "",
  nickname: "",
  wins: 0,
  losses: 0,
  draws: 0,
});

beforeEach(() => {
  localStorage.clear();
  usePlayerStore.setState({
    nickname: "",
    uid: "",
    role: null,
    score: emptyScore(),
  });
  useGameStore.getState().resetGame();
  useGameStore.setState({ mode: "local", difficulty: "medium" });
});

describe("useGameStore", () => {
  it("makeMove places X then O in local mode", () => {
    useGameStore.getState().makeMove(0);
    expect(useGameStore.getState().board[0]).toBe("X");
    expect(useGameStore.getState().currentTurn).toBe("O");
    expect(useGameStore.getState().status).toBe("playing");

    useGameStore.getState().makeMove(1);
    expect(useGameStore.getState().board[1]).toBe("O");
    expect(useGameStore.getState().currentTurn).toBe("X");
  });

  it("detects a win and stores the winning line", () => {
    useGameStore.getState().makeMove(0);
    useGameStore.getState().makeMove(3);
    useGameStore.getState().makeMove(1);
    useGameStore.getState().makeMove(4);
    useGameStore.getState().makeMove(2);

    const s = useGameStore.getState();
    expect(s.status).toBe("win");
    expect(s.winner).toBe("X");
    expect(s.winLine).toEqual([0, 1, 2]);
  });

  it("detects a draw", () => {
    const moves = [0, 1, 2, 4, 3, 5, 7, 6, 8];
    for (const m of moves) {
      useGameStore.getState().makeMove(m);
    }
    expect(useGameStore.getState().status).toBe("draw");
    expect(useGameStore.getState().winner).toBeNull();
  });

  it("resetGame clears the board but keeps mode and difficulty", () => {
    useGameStore.setState({ mode: "solo", difficulty: "hard" });
    useGameStore.getState().makeMove(0);
    useGameStore.getState().resetGame();

    const s = useGameStore.getState();
    expect(s.board.every((c) => c === null)).toBe(true);
    expect(s.status).toBe("idle");
    expect(s.mode).toBe("solo");
    expect(s.difficulty).toBe("hard");
  });

  it("ignores moves on occupied cells and when not my turn (online O on X turn)", () => {
    useGameStore.setState({ mode: "online" });
    usePlayerStore.setState({ role: "O" });

    useGameStore.getState().makeMove(4);
    expect(useGameStore.getState().board.every((c) => c === null)).toBe(true);

    usePlayerStore.setState({ role: "X" });
    useGameStore.getState().makeMove(0);
    useGameStore.getState().makeMove(0);
    expect(useGameStore.getState().board[0]).toBe("X");
  });

  it("getIsMyTurn is true for solo default (human as X) on X turn", () => {
    useGameStore.setState({ mode: "solo" });
    expect(useGameStore.getState().getIsMyTurn()).toBe(true);
  });
});
