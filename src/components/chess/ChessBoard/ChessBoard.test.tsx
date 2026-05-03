import { render } from "@testing-library/react";
import { describe, it } from "vite-plus/test";
import { ChessBoard } from "./index";

describe("ChessBoard", () => {
  it("renders without crashing", () => {
    render(<ChessBoard />);
  });

  it("renders with flipped orientation", () => {
    render(<ChessBoard flipped />);
  });

  it("renders in locked mode", () => {
    render(<ChessBoard locked />);
  });
});
