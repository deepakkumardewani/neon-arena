import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vite-plus/test";

import { MatchmakingPage } from "@/pages/Matchmaking";

describe("MatchmakingPage", () => {
  it("renders title", () => {
    render(
      <MemoryRouter>
        <MatchmakingPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /matchmaking/i })).toBeInTheDocument();
  });
});
