import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { ChessPiece } from "./index";

describe("ChessPiece", () => {
  it("renders a white queen without crashing", () => {
    render(<ChessPiece piece={{ type: "queen", color: "white" }} />);
  });

  it("renders a black king without crashing", () => {
    render(<ChessPiece piece={{ type: "king", color: "black" }} />);
  });

  it("renders all piece types without crashing", () => {
    const types = ["king", "queen", "rook", "bishop", "knight", "pawn"] as const;
    for (const type of types) {
      render(<ChessPiece piece={{ type, color: "white" }} />);
      render(<ChessPiece piece={{ type, color: "black" }} />);
    }
  });

  it("applies a custom size prop", () => {
    const { container } = render(<ChessPiece piece={{ type: "pawn", color: "white" }} size={24} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("24");
    expect(svg?.getAttribute("height")).toBe("24");
  });
});
