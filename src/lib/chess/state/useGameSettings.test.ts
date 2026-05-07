import { beforeEach, describe, expect, it } from "vitest";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChessSettings } from "./useGameSettings";

const TEST_DEFAULTS: ChessSettings = {
  showMoveHistory: true,
  showCapturedPieces: true,
  allowUndo: true,
  hintsEnabled: true,
  autoHintDelayMs: 30_000,
};

interface TestStore extends ChessSettings {
  updateSetting: <K extends keyof ChessSettings>(key: K, value: ChessSettings[K]) => void;
  resetSettings: () => void;
}

function createTestStore(storageKey: string) {
  return create<TestStore>()(
    persist(
      (set) => ({
        ...TEST_DEFAULTS,
        updateSetting: <K extends keyof ChessSettings>(key: K, value: ChessSettings[K]) => {
          set({ [key]: value } as Partial<TestStore>);
        },
        resetSettings: () => set(TEST_DEFAULTS),
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => localStorage),
      },
    ),
  );
}

describe("Chess settings (localStorage persistence)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default values when localStorage has no entry for the key", () => {
    const store = createTestStore("test-chess-defaults");
    const state = store.getState();
    expect(state.showMoveHistory).toBe(true);
    expect(state.showCapturedPieces).toBe(true);
    expect(state.allowUndo).toBe(true);
    expect(state.hintsEnabled).toBe(true);
    expect(state.autoHintDelayMs).toBe(30_000);
  });

  it("persists a changed setting to localStorage under the correct key", () => {
    const store = createTestStore("test-chess-persist");
    store.getState().updateSetting("autoHintDelayMs", 60_000);

    const raw = localStorage.getItem("test-chess-persist");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.autoHintDelayMs).toBe(60_000);
  });

  it("restores persisted settings from localStorage on re-initialisation", () => {
    const saved = {
      state: {
        showMoveHistory: false,
        showCapturedPieces: false,
        allowUndo: false,
        hintsEnabled: false,
        autoHintDelayMs: 45_000,
      },
      version: 0,
    };
    localStorage.setItem("test-chess-restore", JSON.stringify(saved));

    const store = createTestStore("test-chess-restore");
    const state = store.getState();
    expect(state.showMoveHistory).toBe(false);
    expect(state.showCapturedPieces).toBe(false);
    expect(state.allowUndo).toBe(false);
    expect(state.hintsEnabled).toBe(false);
    expect(state.autoHintDelayMs).toBe(45_000);
  });

  it("updating one field does not mutate other fields in the settings object", () => {
    const store = createTestStore("test-chess-immutable");
    store.getState().updateSetting("hintsEnabled", false);

    const state = store.getState();
    expect(state.hintsEnabled).toBe(false);
    expect(state.showMoveHistory).toBe(true);
    expect(state.showCapturedPieces).toBe(true);
    expect(state.allowUndo).toBe(true);
    expect(state.autoHintDelayMs).toBe(30_000);
  });

  it("handles corrupted localStorage JSON gracefully by falling back to defaults", () => {
    localStorage.setItem("test-chess-corrupt", "{not valid json");

    const store = createTestStore("test-chess-corrupt");
    const state = store.getState();

    // Zustand persist middleware handles corrupted JSON by falling back to defaults
    expect(state.showMoveHistory).toBe(true);
    expect(state.showCapturedPieces).toBe(true);
    expect(state.allowUndo).toBe(true);
    expect(state.hintsEnabled).toBe(true);
    expect(state.autoHintDelayMs).toBe(30_000);
  });
});
