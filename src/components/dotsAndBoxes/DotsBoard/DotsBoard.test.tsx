import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createInitialState } from "@/lib/dotsAndBoxes/engine/rules";
import { DotsBoard } from "./index";

const SIZE_3 = { rows: 3, cols: 3 } as const;
const SIZE_4 = { rows: 4, cols: 4 } as const;
const SIZE_5 = { rows: 5, cols: 5 } as const;

function countEdges(rows: number, cols: number) {
  // horizontal: (rows+1)*cols, vertical: rows*(cols+1)
  return (rows + 1) * cols + rows * (cols + 1);
}

describe("DotsBoard", () => {
  it("renders 3×3 board without crash", () => {
    const state = createInitialState(SIZE_3);
    render(
      <DotsBoard state={state} onClaimEdge={vi.fn()} onHoverEdge={vi.fn()} />,
    );
  });

  it("renders 4×4 board without crash", () => {
    const state = createInitialState(SIZE_4);
    render(
      <DotsBoard state={state} onClaimEdge={vi.fn()} onHoverEdge={vi.fn()} />,
    );
  });

  it("renders 5×5 board without crash", () => {
    const state = createInitialState(SIZE_5);
    render(
      <DotsBoard state={state} onClaimEdge={vi.fn()} onHoverEdge={vi.fn()} />,
    );
  });

  it("dispatches claimEdge on edge click", () => {
    const onClaimEdge = vi.fn();
    const state = createInitialState(SIZE_3);
    const { container } = render(
      <DotsBoard state={state} onClaimEdge={onClaimEdge} onHoverEdge={vi.fn()} />,
    );
    const buttons = container.querySelectorAll('[role="button"]');
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(onClaimEdge).toHaveBeenCalledOnce();
  });

  it("disabled state prevents dispatch", () => {
    const onClaimEdge = vi.fn();
    const state = createInitialState(SIZE_3);
    const { container } = render(
      <DotsBoard state={state} onClaimEdge={onClaimEdge} onHoverEdge={vi.fn()} isDisabled />,
    );
    // No interactive role buttons when disabled
    const buttons = container.querySelectorAll('[role="button"]');
    buttons.forEach((b) => fireEvent.click(b));
    expect(onClaimEdge).not.toHaveBeenCalled();
  });

  it("correct number of edge elements for 3×3 board", () => {
    const state = createInitialState(SIZE_3);
    const { container } = render(
      <DotsBoard state={state} onClaimEdge={vi.fn()} onHoverEdge={vi.fn()} />,
    );
    // Each edge has an SVG element
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(countEdges(3, 3));
  });
});
