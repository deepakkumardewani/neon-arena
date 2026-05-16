import { render } from "@testing-library/react";
import { describe, it, expect } from "vite-plus/test";
import { Dot } from "./Dot";

describe("Dot", () => {
  it("renders without crash", () => {
    render(<Dot />);
  });

  it("renders a rounded-full element", () => {
    const { container } = render(<Dot />);
    const dot = container.querySelector(".rounded-full");
    expect(dot).not.toBeNull();
  });
});
