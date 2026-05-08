import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnect4Store } from "../state/useConnect4Store";
import { useConnect4Settings } from "../state/useConnect4Settings";
import { useConnect4HintSystem } from "./useConnect4HintSystem";

vi.mock("../state/useConnect4Settings");
vi.mock("../state/useConnect4Store");
vi.mock("../../chess/hints/useHintSystem", () => ({
  useHintSystem: vi.fn((opts) => ({
    secondsUntilAutoHint: opts.isPlayerTurn ? 30 : null,
    canHint: opts.tokens > 0 && opts.enabled,
    onUserActivity: vi.fn(),
  })),
}));

import { useHintSystem } from "../../chess/hints/useHintSystem";

const mockRequestHint = vi.fn();

function setupMocks({
  status = "playing" as const,
  hintTokens = 3,
  hintsEnabled = true,
  autoHintDelayMs = 30_000,
  isThinking = false,
} = {}) {
  vi.mocked(useConnect4Store).mockReturnValue({
    state: { status, hintTokens } as ReturnType<typeof useConnect4Store>["state"],
    requestHint: mockRequestHint,
  } as unknown as ReturnType<typeof useConnect4Store>);

  vi.mocked(useConnect4Settings).mockImplementation((selector: unknown) => {
    const store = { hintsEnabled, autoHintDelayMs };
    return typeof selector === "function" ? selector(store) : store;
  });

  return isThinking;
}

describe("useConnect4HintSystem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes isPlayerTurn=true when playing and not thinking", () => {
    const isThinking = setupMocks({ status: "playing", isThinking: false });

    renderHook(() => useConnect4HintSystem({ isThinking }));

    expect(useHintSystem).toHaveBeenCalledWith(
      expect.objectContaining({ isPlayerTurn: true }),
    );
  });

  it("passes isPlayerTurn=false when AI is thinking", () => {
    setupMocks({ status: "playing", isThinking: true });

    renderHook(() => useConnect4HintSystem({ isThinking: true }));

    expect(useHintSystem).toHaveBeenCalledWith(
      expect.objectContaining({ isPlayerTurn: false }),
    );
  });

  it("passes isPlayerTurn=false when game is not playing", () => {
    setupMocks({ status: "finished" as const, isThinking: false });

    renderHook(() => useConnect4HintSystem({ isThinking: false }));

    expect(useHintSystem).toHaveBeenCalledWith(
      expect.objectContaining({ isPlayerTurn: false }),
    );
  });

  it("forwards tokens from store to useHintSystem", () => {
    setupMocks({ hintTokens: 1 });

    renderHook(() => useConnect4HintSystem({ isThinking: false }));

    expect(useHintSystem).toHaveBeenCalledWith(
      expect.objectContaining({ tokens: 1 }),
    );
  });

  it("canHint is false when tokens are 0", () => {
    setupMocks({ hintTokens: 0 });

    const { result } = renderHook(() => useConnect4HintSystem({ isThinking: false }));

    expect(result.current.canHint).toBe(false);
  });

  it("canHint is false when hints are disabled", () => {
    setupMocks({ hintsEnabled: false, hintTokens: 3 });

    const { result } = renderHook(() => useConnect4HintSystem({ isThinking: false }));

    expect(result.current.canHint).toBe(false);
  });

  it("wires onRequestHint to store.requestHint", () => {
    setupMocks();

    renderHook(() => useConnect4HintSystem({ isThinking: false }));

    const { onRequestHint } = vi.mocked(useHintSystem).mock.calls[0][0];
    act(() => {
      onRequestHint();
    });

    expect(mockRequestHint).toHaveBeenCalledOnce();
  });

  it("secondsUntilAutoHint is null during AI turn", () => {
    setupMocks({ isThinking: true });

    const { result } = renderHook(() => useConnect4HintSystem({ isThinking: true }));

    expect(result.current.secondsUntilAutoHint).toBeNull();
  });
});
