import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Edge } from "./Edge";

describe("Edge", () => {
  it("renders undrawn horizontal edge without crash", () => {
    render(<Edge orientation="horizontal" isDrawn={false} />);
  });

  it("renders drawn P1 horizontal edge", () => {
    render(<Edge orientation="horizontal" isDrawn drawnBy={1} currentPlayer={1} />);
  });

  it("renders drawn P2 vertical edge", () => {
    render(<Edge orientation="vertical" isDrawn drawnBy={2} currentPlayer={2} />);
  });

  it("renders hint state", () => {
    render(<Edge orientation="horizontal" isDrawn={false} isHint />);
  });

  it("disabled suppresses click handler", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Edge orientation="horizontal" isDrawn={false} isDisabled onClick={onClick} />,
    );
    const el = container.firstChild as HTMLElement;
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick when not disabled and not drawn", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Edge orientation="horizontal" isDrawn={false} isDisabled={false} onClick={onClick} />,
    );
    const el = container.firstChild as HTMLElement;
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick on an already drawn edge", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Edge orientation="horizontal" isDrawn drawnBy={1} onClick={onClick} />,
    );
    const el = container.firstChild as HTMLElement;
    fireEvent.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });
});
