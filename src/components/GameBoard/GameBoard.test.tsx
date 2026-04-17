import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { GameBoard } from "@/components/GameBoard";

describe("GameBoard", () => {
  it("renders glyphs for occupied cells", () => {
    const board = ["X", "O", null, null, null, null, null, null, null] as const;
    render(<GameBoard board={board} winLine={null} winner={null} onCellClick={() => undefined} />);
    expect(screen.getByRole("button", { name: /row 1 column 1, X/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /row 1 column 2, O/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /row 1 column 3, empty/i })).toBeEnabled();
  });

  it("does not call onCellClick when clicking an occupied cell", async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();
    const board = ["X", null, null, null, null, null, null, null, null] as const;
    render(<GameBoard board={board} winLine={null} winner={null} onCellClick={onCellClick} />);
    await user.click(screen.getByRole("button", { name: /row 1 column 1, X/i }));
    expect(onCellClick).not.toHaveBeenCalled();
  });

  it("calls onCellClick for empty cells", async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();
    const board = [null, null, null, null, null, null, null, null, null] as const;
    render(<GameBoard board={board} winLine={null} winner={null} onCellClick={onCellClick} />);
    await user.click(screen.getByRole("button", { name: /row 2 column 2, empty/i }));
    expect(onCellClick).toHaveBeenCalledWith(4);
  });
});
