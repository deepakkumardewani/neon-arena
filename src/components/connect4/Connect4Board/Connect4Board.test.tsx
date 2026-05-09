import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vite-plus/test";
import { useConnect4Store } from "@/lib/connect4/state/useConnect4Store";
import { useConnect4Settings } from "@/lib/connect4/state/useConnect4Settings";
import { Connect4Board } from "./index";

beforeEach(() => {
  useConnect4Store.setState((s) => ({
    state: { ...s.state, status: "playing", animatingDisc: null },
  }));
  useConnect4Settings.setState({ animationSpeedMs: 60 });
});

describe("Connect4Board", () => {
  it("renders 42 cells (7 cols × 6 rows)", () => {
    render(<Connect4Board />);
    const dropZones = screen.getAllByRole("button");
    expect(dropZones.length).toBe(7);
  });

  it("renders without crash in default state", () => {
    render(<Connect4Board />);
  });

  it("renders without crash when disabled", () => {
    render(<Connect4Board isThinking />);
  });

  it("renders FallingDisc overlay when animatingDisc is set and animationSpeedMs > 0", () => {
    useConnect4Store.setState((s) => ({
      state: {
        ...s.state,
        animatingDisc: { col: 3, fromRow: 5, toRow: 2, player: 1 },
      },
    }));
    render(<Connect4Board />);
    expect(screen.getByTestId("falling-disc")).toBeTruthy();
  });

  it("does not render FallingDisc when animationSpeedMs is 0", () => {
    useConnect4Settings.setState({ animationSpeedMs: 0 });
    useConnect4Store.setState((s) => ({
      state: {
        ...s.state,
        animatingDisc: { col: 3, fromRow: 5, toRow: 2, player: 1 },
      },
    }));
    render(<Connect4Board />);
    expect(screen.queryByTestId("falling-disc")).toBeNull();
  });

  it("does not render FallingDisc when reduced motion is active", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);

    useConnect4Store.setState((s) => ({
      state: {
        ...s.state,
        animatingDisc: { col: 3, fromRow: 5, toRow: 2, player: 1 },
      },
    }));
    render(<Connect4Board />);
    expect(screen.queryByTestId("falling-disc")).toBeNull();
  });
});
