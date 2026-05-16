import { describe, it, expect } from "vitest";
import { docToState, stateToDoc } from "./dotsGameMappers";
import { createInitialState } from "../engine/rules";
import type { GameDoc } from "@/types/firebase";

describe("dotsGameMappers", () => {
  describe("stateToDoc", () => {
    it("should convert state to document patch", () => {
      const state = createInitialState({ rows: 5, cols: 5 });
      const patch = stateToDoc(state);

      expect(patch.horizontalEdges).toBeDefined();
      expect(patch.verticalEdges).toBeDefined();
      expect(patch.boxOwner).toBeDefined();
      expect(patch.currentPlayer).toBe(1);
      expect(patch.scores).toEqual({ 1: 0, 2: 0 });
      expect(patch.history).toEqual([]);
      expect(patch.status).toBe("idle");
      expect(patch.winner).toBe(null);
      expect(patch.lastMoveAt).toBeGreaterThan(0);
    });

    it("should preserve null boxOwner cells", () => {
      const state = createInitialState({ rows: 3, cols: 3 });
      const patch = stateToDoc(state);

      // All boxes unclaimed initially
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(patch.boxOwner[r][c]).toBe(null);
        }
      }
    });

    it("should serialize 2D boolean arrays without undefined", () => {
      const state = createInitialState({ rows: 5, cols: 5 });
      const patch = stateToDoc(state);

      // Check horizontal edges: 6 rows x 5 cols
      expect(patch.horizontalEdges).toHaveLength(6);
      for (const row of patch.horizontalEdges) {
        expect(row).toHaveLength(5);
        for (const edge of row) {
          expect(typeof edge).toBe("boolean");
          expect(edge).toBe(false);
        }
      }

      // Check vertical edges: 5 rows x 6 cols
      expect(patch.verticalEdges).toHaveLength(5);
      for (const row of patch.verticalEdges) {
        expect(row).toHaveLength(6);
        for (const edge of row) {
          expect(typeof edge).toBe("boolean");
          expect(edge).toBe(false);
        }
      }
    });
  });

  describe("docToState", () => {
    it("should convert firebase doc to game state", () => {
      const state = createInitialState({ rows: 5, cols: 5 });
      const patch = stateToDoc(state);

      const mockDoc: GameDoc = {
        gameId: "test-game",
        gameType: "dots-and-boxes",
        playerX: { uid: "p1", queueEntryId: undefined },
        playerO: { uid: "p2", queueEntryId: undefined },

        ...patch,
      } as unknown as GameDoc;

      const converted = docToState(mockDoc);

      expect(converted.currentPlayer).toBe(1);
      expect(converted.scores).toEqual({ 1: 0, 2: 0 });
      expect(converted.status).toBe("idle");
      expect(converted.winner).toBeNull();
      expect(converted.size.rows).toBe(6);
      expect(converted.size.cols).toBe(6);
    });

    it("should map winner correctly", () => {
      const state = createInitialState({ rows: 5, cols: 5 });
      const patchBase = stateToDoc(state);

      // Test winner = 1
      const docWinner1 = {
        gameId: "test",
        gameType: "dots-and-boxes",
        playerX: { uid: "p1" },
        playerO: { uid: "p2" },

        ...patchBase,
        winner: 1,
      } as unknown as GameDoc;

      const converted1 = docToState(docWinner1);
      expect(converted1.winner).toBe(1);

      // Test winner = "draw"
      const docDraw = {
        gameId: "test",
        gameType: "dots-and-boxes",
        playerX: { uid: "p1" },
        playerO: { uid: "p2" },

        ...patchBase,
        winner: "draw",
      } as unknown as GameDoc;
      const convertedDraw = docToState(docDraw);
      expect(convertedDraw.winner).toBe("draw");
    });

    it("should infer board size from edge array dimensions", () => {
      const state = createInitialState({ rows: 3, cols: 3 });
      const patch = stateToDoc(state);

      const mockDoc: GameDoc = {
        gameId: "test",
        gameType: "dots-and-boxes",
        playerX: { uid: "p1" },
        playerO: { uid: "p2" },

        ...patch,
      } as unknown as GameDoc;

      const converted = docToState(mockDoc);
      expect(converted.size.rows).toBe(4);
      expect(converted.size.cols).toBe(4);
    });
  });

  describe("round-trip fidelity", () => {
    it("should preserve state through doc -> state -> doc cycle", () => {
      const original = createInitialState({ rows: 5, cols: 5 });
      const patch1 = stateToDoc(original);

      // Create a mock doc
      const mockDoc: GameDoc = {
        gameId: "test",
        gameType: "dots-and-boxes",
        playerX: { uid: "p1" },
        playerO: { uid: "p2" },

        ...patch1,
      } as unknown as GameDoc;

      const converted = docToState(mockDoc);
      const patch2 = stateToDoc(converted);

      // Compare critical fields
      expect(patch2.currentPlayer).toBe(patch1.currentPlayer);
      expect(patch2.scores).toEqual(patch1.scores);
      expect(patch2.status).toBe(patch1.status);
      expect(patch2.winner).toBe(patch1.winner);
      expect(patch2.horizontalEdges).toEqual(patch1.horizontalEdges);
      expect(patch2.verticalEdges).toEqual(patch1.verticalEdges);
    });
  });
});
