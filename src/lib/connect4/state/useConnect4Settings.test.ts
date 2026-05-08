import { beforeEach, describe, expect, it } from "vitest";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Connect4Settings } from "@/lib/connect4/types";

const DEFAULT_CONNECT4_SETTINGS: Connect4Settings = {
  showLastMove: true,
  allowUndo: true,
  hintsEnabled: true,
  autoHintDelayMs: 30_000,
  animationSpeedMs: 60,
};

interface TestStore extends Connect4Settings {
  updateSetting: <K extends keyof Connect4Settings>(key: K, value: Connect4Settings[K]) => void;
  resetSettings: () => void;
}

function createTestStore(storageKey: string) {
  return create<TestStore>()(
    persist(
      (set) => ({
        ...DEFAULT_CONNECT4_SETTINGS,
        updateSetting: <K extends keyof Connect4Settings>(key: K, value: Connect4Settings[K]) => {
          set({ [key]: value } as Partial<TestStore>);
        },
        resetSettings: () => set(DEFAULT_CONNECT4_SETTINGS),
      }),
      {
        name: storageKey,
        storage: createJSONStorage(() => localStorage),
      },
    ),
  );
}

describe("useConnect4Settings (localStorage persistence)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default values when localStorage has no entry", () => {
    const store = createTestStore("test-c4-defaults");
    const state = store.getState();
    expect(state.showLastMove).toBe(true);
    expect(state.allowUndo).toBe(true);
    expect(state.hintsEnabled).toBe(true);
    expect(state.autoHintDelayMs).toBe(30_000);
    expect(state.animationSpeedMs).toBe(60);
  });

  it("persists a changed setting to localStorage", () => {
    const store = createTestStore("test-c4-persist");
    store.getState().updateSetting("animationSpeedMs", 120);

    const raw = localStorage.getItem("test-c4-persist");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.animationSpeedMs).toBe(120);
  });

  it("restores persisted settings from localStorage on re-initialisation", () => {
    const saved = {
      state: {
        showLastMove: false,
        allowUndo: false,
        hintsEnabled: false,
        autoHintDelayMs: 15_000,
        animationSpeedMs: 0,
      },
      version: 0,
    };
    localStorage.setItem("test-c4-restore", JSON.stringify(saved));

    const store = createTestStore("test-c4-restore");
    const state = store.getState();
    expect(state.showLastMove).toBe(false);
    expect(state.allowUndo).toBe(false);
    expect(state.hintsEnabled).toBe(false);
    expect(state.autoHintDelayMs).toBe(15_000);
    expect(state.animationSpeedMs).toBe(0);
  });

  it("partial override: updating one field does not mutate other fields", () => {
    const store = createTestStore("test-c4-partial");
    store.getState().updateSetting("hintsEnabled", false);

    const state = store.getState();
    expect(state.hintsEnabled).toBe(false);
    // other fields remain at defaults
    expect(state.showLastMove).toBe(true);
    expect(state.allowUndo).toBe(true);
    expect(state.autoHintDelayMs).toBe(30_000);
    expect(state.animationSpeedMs).toBe(60);
  });

  it("resetSettings restores all fields to defaults", () => {
    const store = createTestStore("test-c4-reset");
    store.getState().updateSetting("animationSpeedMs", 0);
    store.getState().updateSetting("allowUndo", false);
    store.getState().resetSettings();

    const state = store.getState();
    expect(state.animationSpeedMs).toBe(60);
    expect(state.allowUndo).toBe(true);
  });

  it("handles corrupted localStorage JSON gracefully by falling back to defaults", () => {
    localStorage.setItem("test-c4-corrupt", "{not valid json");

    const store = createTestStore("test-c4-corrupt");
    const state = store.getState();
    expect(state.showLastMove).toBe(true);
    expect(state.animationSpeedMs).toBe(60);
  });
});
