import { describe, expect, test, vi } from "vitest";
import type { GameDoc } from "@/types/firebase";

// ── Mock Firebase modules before importing the service ──────────────────────

const mocks = vi.hoisted(() => ({
  firestoreDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  runTransaction: vi.fn(),
}));

vi.mock("@/lib/firebase/firestoreDb", () => ({
  db: {} as unknown as never,
}));

vi.mock("@/lib/firebase/client", () => ({
  auth: { currentUser: { uid: "test-user" } },
}));

vi.mock("@/lib/online/gameDocMappers", () => ({
  firestoreDataToGameDoc: (id: string, data: Record<string, unknown>) => ({
    gameId: id,
    gameType: "connect4" as const,
    playerX: data.playerX as GameDoc["playerX"],
    playerO: (data.playerO as GameDoc["playerO"]) ?? null,
    board: (data.board as GameDoc["board"]) ?? [],
    currentTurn: (data.currentTurn as string) ?? "",
    status: (data.status as GameDoc["status"]) ?? "waiting",
    winner: (data.winner as GameDoc["winner"]) ?? null,
    createdAt: (data.createdAt as number) ?? 0,
    expiresAt: (data.expiresAt as number) ?? 0,
    disconnectedAt: (data.disconnectedAt as GameDoc["disconnectedAt"]) ?? null,
    disconnectedBy: (data.disconnectedBy as GameDoc["disconnectedBy"]) ?? null,
    rematch: (data.rematch as GameDoc["rematch"]) ?? {},
    c4board: data.c4board as GameDoc["c4board"],
    c4history: data.c4history as GameDoc["c4history"],
    c4winCells: data.c4winCells as GameDoc["c4winCells"],
  }),
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    doc: mocks.firestoreDoc,
    collection: vi.fn(() => "mock-collection"),
    setDoc: mocks.setDoc,
    updateDoc: mocks.updateDoc,
    getDoc: vi.fn(),
    onSnapshot: vi.fn(),
    runTransaction: mocks.runTransaction,
  };
});

import { connect4GameService } from "./connect4GameService";

describe("connect4GameService", () => {
  describe("createConnect4Game", () => {
    test("creates a game with waiting status and connect4 gameType", async () => {
      mocks.firestoreDoc.mockReturnValue({ id: "test-game-123" });
      mocks.setDoc.mockResolvedValue(undefined);

      const gameId = await connect4GameService.createConnect4Game({
        uid: "p1",
        nickname: "Player 1",
      });

      expect(gameId).toBe("test-game-123");
      expect(mocks.setDoc).toHaveBeenCalledWith(
        { id: "test-game-123" },
        expect.objectContaining({
          gameId: "test-game-123",
          gameType: "connect4",
          status: "waiting",
          playerO: null,
          c4board: expect.any(Array) as unknown[],
          c4history: [],
          c4winCells: null,
        }),
      );
    });

    test("creates an active game when playerO is provided", async () => {
      mocks.firestoreDoc.mockReturnValue({ id: "test-game-456" });
      mocks.setDoc.mockResolvedValue(undefined);

      const gameId = await connect4GameService.createConnect4Game(
        { uid: "p1", nickname: "Player 1" },
        { uid: "p2", nickname: "Player 2" },
      );

      expect(gameId).toBe("test-game-456");
      expect(mocks.setDoc).toHaveBeenCalledWith(
        { id: "test-game-456" },
        expect.objectContaining({
          status: "active",
          playerO: { uid: "p2", nickname: "Player 2" },
        }),
      );
    });
  });

  describe("resignGame", () => {
    test("sets status to finished and winner to the resigning player", async () => {
      mocks.updateDoc.mockResolvedValue(undefined);

      await connect4GameService.resignGame("test-game", "player1-identity");

      expect(mocks.updateDoc).toHaveBeenCalledWith(expect.anything(), {
        status: "finished",
        winner: "player1-identity",
      });
    });
  });

  describe("finishGame", () => {
    test("sets status to finished with given winner", async () => {
      mocks.updateDoc.mockResolvedValue(undefined);

      await connect4GameService.finishGame("test-game", "player2-identity");

      expect(mocks.updateDoc).toHaveBeenCalledWith(expect.anything(), {
        status: "finished",
        winner: "player2-identity",
      });
    });

    test("handles draw (null winner)", async () => {
      mocks.updateDoc.mockResolvedValue(undefined);

      await connect4GameService.finishGame("test-game", "draw");

      expect(mocks.updateDoc).toHaveBeenCalledWith(expect.anything(), {
        status: "finished",
        winner: "draw",
      });
    });
  });

  describe("commitMove", () => {
    test("calls transaction with correct patch shape", async () => {
      const mockTx = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            gameId: "test-game",
            gameType: "connect4",
            playerX: { uid: "test-user", nickname: "P1" },
            playerO: { uid: "p2", nickname: "P2" },
            currentTurn: "test-user",
            status: "active",
          }),
        }),
        update: vi.fn(),
        set: vi.fn(),
      };

      mocks.runTransaction.mockImplementation(
        async (_db: unknown, fn: (tx: typeof mockTx) => Promise<void>) => {
          await fn(mockTx);
        },
      );

      const payload = {
        c4board: Array.from({ length: 7 }, () => Array(6).fill(0)),
        c4history: [{ col: 3, row: 0, player: 1 }],
        currentTurn: "p2",
        c4winCells: null as readonly [number, number][] | null,
      };

      await connect4GameService.commitMove("test-game", payload);

      expect(mockTx.update).toHaveBeenCalledWith(expect.anything(), {
        c4board: payload.c4board,
        c4history: payload.c4history,
        currentTurn: payload.currentTurn,
        c4winCells: payload.c4winCells,
      });
    });
  });

  describe("setDisconnected", () => {
    test("sets disconnectedAt and disconnectedBy", async () => {
      mocks.updateDoc.mockResolvedValue(undefined);

      await connect4GameService.setDisconnected("test-game", "uid-123");

      expect(mocks.updateDoc).toHaveBeenCalledWith(expect.anything(), {
        disconnectedAt: expect.any(Number) as number,
        disconnectedBy: "uid-123",
      });
    });
  });
});
