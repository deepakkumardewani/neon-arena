import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { ColumnDropZone } from "./ColumnDropZone";

const baseProps = {
  col: 3,
  currentPlayer: 1 as const,
  onClick: vi.fn(),
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn(),
};

describe("ColumnDropZone", () => {
  it("renders without crash", () => {
    render(<ColumnDropZone {...baseProps} />);
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<ColumnDropZone {...baseProps} onClick={onClick} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledWith(3);
  });

  it("does not call onClick when isFull", () => {
    const onClick = vi.fn();
    render(<ColumnDropZone {...baseProps} onClick={onClick} isFull />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(<ColumnDropZone {...baseProps} onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  // T23: hover arrow and hint animation
  it("renders hint arrow when isHint and not disabled", () => {
    render(<ColumnDropZone {...baseProps} isHint />);
    // Arrow SVG should be present in the drop zone
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("does not render arrow when disabled (even when isHint)", () => {
    render(<ColumnDropZone {...baseProps} isHint disabled />);
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).toBeNull();
  });

  it("renders hover arrow when isHovered and not disabled", () => {
    render(<ColumnDropZone {...baseProps} isHovered />);
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("does not render arrow when not hovered and not hint", () => {
    render(<ColumnDropZone {...baseProps} isHovered={false} isHint={false} />);
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).toBeNull();
  });

  it("applies cyan background tint on hint column", () => {
    const { container } = render(<ColumnDropZone {...baseProps} isHint />);
    const btn = container.querySelector<HTMLElement>('[role="button"]');
    expect(btn?.style.background).toContain("na-cyan");
  });
});
