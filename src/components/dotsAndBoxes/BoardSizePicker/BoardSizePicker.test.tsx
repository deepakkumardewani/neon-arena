import { render, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { useDotsSettings } from "@/lib/dotsAndBoxes/state/useDotsSettings";
import { BoardSizePicker } from "./index";

describe("BoardSizePicker", () => {
  beforeEach(() => {
    useDotsSettings.setState({ defaultSize: { rows: 5, cols: 5 } });
  });

  it("renders three size options in solo mode", () => {
    const { getByText } = render(<BoardSizePicker mode="solo" hasStarted={false} />);
    expect(getByText("3×3")).toBeDefined();
    expect(getByText("4×4")).toBeDefined();
    expect(getByText("5×5")).toBeDefined();
  });

  it("hidden in online mode", () => {
    const { container } = render(<BoardSizePicker mode="online" hasStarted={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("hidden in friend mode", () => {
    const { container } = render(<BoardSizePicker mode="friend" hasStarted={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("hidden after game has started", () => {
    const { container } = render(<BoardSizePicker mode="solo" hasStarted />);
    expect(container.firstChild).toBeNull();
  });

  it("selecting 3×3 updates settings", () => {
    const { getByText } = render(<BoardSizePicker mode="solo" hasStarted={false} />);
    fireEvent.click(getByText("3×3"));
    const state = useDotsSettings.getState();
    expect(state.defaultSize).toEqual({ rows: 3, cols: 3 });
  });
});
