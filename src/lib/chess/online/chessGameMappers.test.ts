import { describe, it, expect } from "vitest";

import { chessDocToGameState, commitMovePayload } from "./chessGameMappers";
import type { GameDoc, GameDocPlayer } from "@/types/firebase";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function makePlayer(uid: string, nickname: string, queueEntryId?: string): GameDocPlayer {
  return queueEntryId ? { uid, nickname, queueEntryId } : { uid, nickname };
}

function makeGameDoc(overrides: Partial<GameDoc> = {}): GameDoc {
  return {
    gameId: "test-1",
    playerX: makePlayer("uid-white", "WhitePlayer", "q-white"),
    playerO: makePlayer("uid-black", "BlackPlayer", "q-black"),
    board: [null, null, null, null, null, null, null, null, null],
    currentTurn: "q-white",
    status: "active",
    winner: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 600_000,
    disconnectedAt: null,
    disconnectedBy: null,
    rematch: {},
    gameType: "chess",
    fen: STARTING_FEN,
    moveHistory: [],
    capturedByWhite: [],
    capturedByBlack: [],
    ...overrides,
  };
}

describe("chessDocToGameState", () => {
  it('maps status: "waiting" doc to status: "playing" game state', () => {
    const doc = makeGameDoc({ status: "waiting", playerO: null });
    const state = chessDocToGameState(doc);
    expect(state.status).toBe("playing");
    expect(state.activeColor).toBe("white");
    expect(state.winner).toBeNull();
    expect(state.fen).toBe(STARTING_FEN);
  });

  it('maps status: "active" doc with correct currentTurn color', () => {
    const doc = makeGameDoc({
      status: "active",
      currentTurn: "q-white",
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    });
    const state = chessDocToGameState(doc);
    expect(state.status).toBe("playing");
    // FEN says black to move
    expect(state.activeColor).toBe("black");
  });

  it('maps status: "finished" + winner: "draw" to status: "draw"', () => {
    const doc = makeGameDoc({
      status: "finished",
      winner: "draw",
    });
    const state = chessDocToGameState(doc);
    expect(state.status).toBe("draw");
    expect(state.winner).toBeNull();
  });

  it('maps status: "finished" + winner: <uid> to status: "checkmate" with correct winner color', () => {
    const doc = makeGameDoc({
      status: "finished",
      winner: "q-white",
    });
    const state = chessDocToGameState(doc);
    expect(state.status).toBe("checkmate");
    expect(state.winner).toBe("white");
  });

  it('maps status: "finished" + winner: <uid> to status: "checkmate" with black winner', () => {
    const doc = makeGameDoc({
      status: "finished",
      winner: "q-black",
    });
    const state = chessDocToGameState(doc);
    expect(state.status).toBe("checkmate");
    expect(state.winner).toBe("black");
  });

  it('applies resign override: losing player\'s uid → status: "resigned" for opponent', () => {
    const doc = makeGameDoc({
      status: "finished",
      winner: "q-black", // black resigned, white wins
    });
    const state = chessDocToGameState(doc, { winsAs: "white" });
    expect(state.status).toBe("resigned");
    expect(state.winner).toBe("white");
  });

  it("handles expired game docs", () => {
    const doc = makeGameDoc({
      status: "active",
      expiresAt: Date.now() - 1000,
    });
    const state = chessDocToGameState(doc);
    expect(state.status).toBe("abandoned");
  });

  it("reads captured pieces from doc", () => {
    const doc = makeGameDoc({
      capturedByWhite: ["pawn", "knight"],
      capturedByBlack: ["bishop"],
    });
    const state = chessDocToGameState(doc);
    expect(state.capturedByWhite).toEqual(["pawn", "knight"]);
    expect(state.capturedByBlack).toEqual(["bishop"]);
  });
});

describe("commitMovePayload", () => {
  it("returns correct patch shape { fen, history, currentTurn, lastMoveAt }", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const history = ["e4"];
    const currentTurn = "q-black";

    const payload = commitMovePayload(fen, history, currentTurn);

    expect(payload).toEqual({
      fen,
      history: ["e4"],
      currentTurn: "q-black",
      lastMoveAt: expect.any(Number) as number,
    });
    expect(payload.lastMoveAt).toBeGreaterThan(0);
  });

  it("does not mutate input history array", () => {
    const history = ["e4", "e5"];
    const frozen = [...history];
    commitMovePayload(STARTING_FEN, history, "q-white");
    expect(history).toEqual(frozen);
  });
});
