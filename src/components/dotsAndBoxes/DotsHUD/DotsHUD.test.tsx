import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DotsHUD } from "./index";

const baseProps = {
  currentPlayer: 1 as const,
  hintTokens: 3,
  historyLength: 0,
  status: "playing" as const,
};

describe("DotsHUD", () => {
  it("renders without crash", () => {
    render(<DotsHUD {...baseProps} />);
  });

  it("hint button is disabled when hintTokens is 0", () => {
    const { getByRole } = render(<DotsHUD {...baseProps} hintTokens={0} hintsEnabled />);
    const btn = getByRole("button", { name: /hint/i });
    expect(btn).toBeDisabled();
  });

  it("hint button is enabled when hintTokens > 0", () => {
    const { getByRole } = render(<DotsHUD {...baseProps} hintTokens={2} hintsEnabled />);
    const btn = getByRole("button", { name: /hint/i });
    expect(btn).not.toBeDisabled();
  });

  it("undo button is hidden when showUndo is false", () => {
    const { queryByRole } = render(<DotsHUD {...baseProps} showUndo={false} />);
    expect(queryByRole("button", { name: /undo/i })).toBeNull();
  });

  it("undo button visible when showUndo is true", () => {
    const { getByRole } = render(<DotsHUD {...baseProps} showUndo historyLength={1} />);
    expect(getByRole("button", { name: /undo/i })).toBeDefined();
  });

  it("shows thinking indicator when isThinking", () => {
    const { getByText } = render(<DotsHUD {...baseProps} isThinking />);
    expect(getByText("Thinking…")).toBeDefined();
  });

  it("calls onRequestHint when hint button clicked", () => {
    const onRequestHint = vi.fn();
    const { getByRole } = render(
      <DotsHUD {...baseProps} hintTokens={2} hintsEnabled onRequestHint={onRequestHint} />,
    );
    fireEvent.click(getByRole("button", { name: /hint/i }));
    expect(onRequestHint).toHaveBeenCalledOnce();
  });
});
