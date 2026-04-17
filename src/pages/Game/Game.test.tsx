import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vite-plus/test";

import { GamePage } from "@/pages/Game";

describe("GamePage", () => {
  it("renders title", () => {
    render(
      <MemoryRouter initialEntries={["/play/tictactoe/game"]}>
        <Routes>
          <Route path="/play/tictactoe/game" element={<GamePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /^game$/i })).toBeInTheDocument();
  });
});
