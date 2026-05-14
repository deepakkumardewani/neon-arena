import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Box } from "./Box";

describe("Box", () => {
  it("renders unclaimed box without crash", () => {
    render(<Box owner={null} />);
  });

  it("renders unclaimed box as transparent (opacity 0)", () => {
    const { container } = render(<Box owner={null} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.opacity).toBe("0");
  });

  it("renders claimed P1 box", () => {
    const { container } = render(<Box owner={1} />);
    expect(container.textContent).toContain("A");
  });

  it("renders claimed P2 box", () => {
    const { container } = render(<Box owner={2} />);
    expect(container.textContent).toContain("B");
  });

  it("applies last-claimed glow class when isLastClaimed", () => {
    const { container } = render(<Box owner={1} isLastClaimed />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("na-dab-box-claim-glow");
  });

  it("does not apply glow class when not last claimed", () => {
    const { container } = render(<Box owner={1} isLastClaimed={false} />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("na-dab-box-claim-glow");
  });
});
