import { describe, expect, it } from "vite-plus/test";

import { gameDocToRemoteSync } from "@/lib/online/gameDocMappers";
import type { GameDoc } from "@/types/firebase";

function baseDoc(overrides: Partial<GameDoc> = {}): GameDoc {
  return {
    gameId: "g1",
    playerX: { uid: "x1", nickname: "A" },
    playerO: { uid: "o1", nickname: "B" },
    board: [null, null, null, null, null, null, null, null, null],
    currentTurn: "x1",
    status: "active",
    winner: null,
    createdAt: 0,
    expiresAt: 9e12,
    disconnectedAt: null,
    disconnectedBy: null,
    rematch: {},
    ...overrides,
  };
}

describe("gameDocToRemoteSync", () => {
  it("maps waiting lobby to idle status", () => {
    const d = baseDoc({ status: "waiting", playerO: null });
    const s = gameDocToRemoteSync(d);
    expect(s.status).toBe("idle");
  });

  it("maps finished draw", () => {
    const d = baseDoc({
      status: "finished",
      winner: "draw",
      board: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
    });
    const s = gameDocToRemoteSync(d);
    expect(s.status).toBe("draw");
  });

  it("applies disconnect win override", () => {
    const d = baseDoc();
    const s = gameDocToRemoteSync(d, { winsAs: "O" });
    expect(s.status).toBe("win");
    expect(s.winner).toBe("O");
  });
});
