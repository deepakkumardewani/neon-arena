import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { Cell } from "./Cell";

describe("Cell", () => {
  it("renders empty cell without crash", () => {
    render(<Cell value={null} />);
  });

  it("renders Player 1 disc", () => {
    render(<Cell value={1} />);
  });

  it("renders Player 2 disc", () => {
    render(<Cell value={2} />);
  });

  it("renders winning state without crash", () => {
    render(<Cell value={1} isWinning />);
  });

  it("renders desaturated state", () => {
    render(<Cell value={2} isDesaturated />);
  });

  it("renders last-placed state", () => {
    render(<Cell value={1} isLastPlaced />);
  });

  it("hides disc when isAnimating", () => {
    const { container } = render(<Cell value={1} isAnimating />);
    // Disc has na-cyan color in its style; hole does not — ensure no cyan disc div
    const cyanDivs = container.querySelectorAll('[style*="na-cyan"]');
    expect(cyanDivs.length).toBe(0);
  });

  it("shows disc when isAnimating is false", () => {
    const { container } = render(<Cell value={1} isAnimating={false} />);
    // Disc div with player color should be present
    const cyanDivs = container.querySelectorAll('[style*="na-cyan"]');
    expect(cyanDivs.length).toBeGreaterThan(0);
  });

  // T22: win highlight + desaturation
  it("applies win-pulse glow class on winning disc", () => {
    const { container } = render(<Cell value={1} isWinning />);
    const disc = container.querySelector(".na-c4-win-pulse");
    expect(disc).not.toBeNull();
  });

  it("does not apply win-pulse class on non-winning disc", () => {
    const { container } = render(<Cell value={1} />);
    expect(container.querySelector(".na-c4-win-pulse")).toBeNull();
  });

  it("applies opacity 0.4 on desaturated disc", () => {
    const { container } = render(<Cell value={2} isDesaturated />);
    // Disc div has inline opacity; find the div with rose color in style
    const disc = container.querySelector<HTMLElement>('[style*="na-rose"]');
    expect(disc?.style.opacity).toBe("0.4");
  });

  it("has opacity 1 on non-desaturated disc", () => {
    const { container } = render(<Cell value={2} />);
    const disc = container.querySelector<HTMLElement>('[style*="na-rose"]');
    expect(disc?.style.opacity).toBe("1");
  });
});
