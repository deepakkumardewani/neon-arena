import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vite-plus/test";
import { useConnect4Store } from "@/lib/connect4/state/useConnect4Store";
import { Connect4HUD } from "./index";

beforeEach(() => {
  useConnect4Store.setState((s) => ({
    state: { ...s.state, status: "playing", hintTokens: 3 },
  }));
});

describe("Connect4HUD", () => {
  it("renders without crash", () => {
    render(<Connect4HUD />);
  });

  it("hint button is disabled when hintTokens is 0", () => {
    useConnect4Store.setState((s) => ({
      state: { ...s.state, hintTokens: 0 },
    }));
    render(<Connect4HUD hintsEnabled />);
    const btn = screen.getByRole("button", { name: /hint/i });
    expect(btn).toBeDisabled();
  });

  it("undo button not shown when showUndo is false", () => {
    render(<Connect4HUD showUndo={false} />);
    expect(screen.queryByRole("button", { name: /undo/i })).toBeNull();
  });

  it("undo button shown when showUndo is true", () => {
    useConnect4Store.setState((s) => ({
      state: { ...s.state, history: [{ col: 3, row: 0, player: 1 }] },
    }));
    render(<Connect4HUD showUndo />);
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
  });
});
