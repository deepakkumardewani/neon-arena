import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import { Connect4GamePage } from "./GamePage";

describe("Connect4GamePage stub", () => {
  it("renders without crashing", () => {
    render(<Connect4GamePage />);
    expect(screen.getByText("Connect 4")).toBeInTheDocument();
  });
});
