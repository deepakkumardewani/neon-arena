import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDotsSettings } from "../state/useDotsSettings";
import { useDotsStore } from "../state/useDotsStore";
import { useDotsHintSystem } from "./useDotsHintSystem";

// Stub the useHintSystem so we don't need real timers
vi.mock("@/lib/chess/hints/useHintSystem", () => ({
  useHintSystem: vi.fn(({ enabled, tokens, isPlayerTurn, onRequestHint }) => ({
    secondsUntilAutoHint: isPlayerTurn && enabled && tokens > 0 ? 30 : null,
    canHint: tokens > 0 && enabled,
    onUserActivity: vi.fn(),
    _onRequestHint: onRequestHint,
  })),
}));

describe("useDotsHintSystem", () => {
  beforeEach(() => {
    useDotsStore.setState({ hintTokens: 3, status: "playing" });
    useDotsSettings.setState({ hintsEnabled: true, autoHintDelayMs: 30_000 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns secondsUntilAutoHint when it is the player's turn", () => {
    const { result } = renderHook(() => useDotsHintSystem({ isPlayerTurn: true }));
    expect(result.current.secondsUntilAutoHint).toBe(30);
  });

  it("returns null secondsUntilAutoHint when AI is thinking (not player turn)", () => {
    const { result } = renderHook(() => useDotsHintSystem({ isPlayerTurn: false }));
    expect(result.current.secondsUntilAutoHint).toBeNull();
  });

  it("canHint is false when tokens are 0", () => {
    act(() => {
      useDotsStore.setState({ hintTokens: 0 });
    });
    const { result } = renderHook(() => useDotsHintSystem({ isPlayerTurn: true }));
    expect(result.current.canHint).toBe(false);
  });

  it("canHint is false when hints disabled in settings", () => {
    act(() => {
      useDotsSettings.setState({ hintsEnabled: false });
    });
    const { result } = renderHook(() => useDotsHintSystem({ isPlayerTurn: true }));
    expect(result.current.canHint).toBe(false);
  });
});
