import { describe, it, expect, beforeEach } from "vitest";
import { useDotsSettings } from "./useDotsSettings";

beforeEach(() => {
  useDotsSettings.getState().resetSettings();
});

describe("useDotsSettings — defaults", () => {
  it("has correct default values", () => {
    const s = useDotsSettings.getState();
    expect(s.defaultSize).toEqual({ rows: 5, cols: 5 });
    expect(s.showLastMove).toBe(true);
    expect(s.allowUndo).toBe(true);
    expect(s.hintsEnabled).toBe(true);
    expect(s.autoHintDelayMs).toBe(30_000);
  });
});

describe("useDotsSettings — updateSetting", () => {
  it("updates a boolean setting", () => {
    useDotsSettings.getState().updateSetting("showLastMove", false);
    expect(useDotsSettings.getState().showLastMove).toBe(false);
  });

  it("updates defaultSize", () => {
    useDotsSettings.getState().updateSetting("defaultSize", { rows: 3, cols: 3 });
    expect(useDotsSettings.getState().defaultSize).toEqual({ rows: 3, cols: 3 });
  });

  it("updates autoHintDelayMs", () => {
    useDotsSettings.getState().updateSetting("autoHintDelayMs", 15_000);
    expect(useDotsSettings.getState().autoHintDelayMs).toBe(15_000);
  });

  it("partial update does not affect other settings", () => {
    useDotsSettings.getState().updateSetting("allowUndo", false);
    expect(useDotsSettings.getState().showLastMove).toBe(true);
    expect(useDotsSettings.getState().hintsEnabled).toBe(true);
  });
});

describe("useDotsSettings — resetSettings", () => {
  it("restores all defaults", () => {
    useDotsSettings.getState().updateSetting("showLastMove", false);
    useDotsSettings.getState().updateSetting("allowUndo", false);
    useDotsSettings.getState().resetSettings();
    const s = useDotsSettings.getState();
    expect(s.showLastMove).toBe(true);
    expect(s.allowUndo).toBe(true);
    expect(s.defaultSize).toEqual({ rows: 5, cols: 5 });
  });
});
