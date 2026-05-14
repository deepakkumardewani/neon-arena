import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DotsScoreBoard } from "./index";

describe("DotsScoreBoard", () => {
  const baseProps = {
    scores: { 1: 0, 2: 0 } as const,
    currentPlayer: 1 as const,
    lastClaimedBoxes: [],
  };

  it("renders without crash", () => {
    render(<DotsScoreBoard {...baseProps} />);
  });

  it("renders P1 and P2 badges", () => {
    const { getByText } = render(
      <DotsScoreBoard {...baseProps} p1Label="Alice" p2Label="Bob" />,
    );
    expect(getByText("Alice")).toBeDefined();
    expect(getByText("Bob")).toBeDefined();
  });

  it("displays correct scores", () => {
    const { getAllByText } = render(
      <DotsScoreBoard {...baseProps} scores={{ 1: 4, 2: 3 }} />,
    );
    expect(getAllByText("4").length).toBeGreaterThan(0);
    expect(getAllByText("3").length).toBeGreaterThan(0);
  });

  it("renders bonus-turn tag when lastClaimedBoxes is non-empty", () => {
    const { getByText } = render(
      <DotsScoreBoard
        {...baseProps}
        lastClaimedBoxes={[{ row: 0, col: 0 }]}
        currentPlayer={1}
      />,
    );
    expect(getByText("+1 turn")).toBeDefined();
  });

  it("does not render bonus-turn tag when lastClaimedBoxes is empty", () => {
    const { queryByText } = render(
      <DotsScoreBoard {...baseProps} lastClaimedBoxes={[]} />,
    );
    expect(queryByText("+1 turn")).toBeNull();
  });
});
