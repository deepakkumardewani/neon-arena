import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import { BoardLabels } from "./BoardLabels";
import { Square } from "./Square";

describe("Square", () => {
  it("renders without crashing", () => {
    render(
      <Square
        index={0}
        piece={null}
        isLight
        onClick={vi.fn()}
        isSelected={false}
        isLegalMove={false}
        isLastMoveFrom={false}
        isLastMoveTo={false}
        isHintFrom={false}
        isHintTo={false}
        isInCheck={false}
      />,
    );
  });

  it("renders a piece when provided", () => {
    render(
      <Square
        index={4}
        piece={{ type: "king", color: "white" }}
        isLight
        onClick={vi.fn()}
        isSelected={false}
        isLegalMove={false}
        isLastMoveFrom={false}
        isLastMoveTo={false}
        isHintFrom={false}
        isHintTo={false}
        isInCheck={false}
      />,
    );
    expect(screen.getByLabelText("white king")).toBeDefined();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Square
        index={7}
        piece={null}
        isLight={false}
        onClick={onClick}
        isSelected={false}
        isLegalMove={false}
        isLastMoveFrom={false}
        isLastMoveTo={false}
        isHintFrom={false}
        isHintTo={false}
        isInCheck={false}
      />,
    );
    await user.click(screen.getByRole("button", { name: "square 7" }));
    expect(onClick).toHaveBeenCalledWith(7);
  });
});

describe("BoardLabels", () => {
  it("renders rank and file labels (normal orientation)", () => {
    const { container } = render(<BoardLabels flipped={false} />);
    expect(container.textContent).toContain("a");
    expect(container.textContent).toContain("8");
  });

  it("renders rank and file labels (flipped orientation)", () => {
    const { container } = render(<BoardLabels flipped={true} />);
    expect(container.textContent).toContain("h");
    expect(container.textContent).toContain("1");
  });
});
