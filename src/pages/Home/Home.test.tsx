import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vite-plus/test";

import { HomePage } from "@/pages/Home";

vi.mock("@/components/ParticleBackground", () => ({
  ParticleBackground: () => null,
}));

vi.mock("@/hooks/usePresence", () => ({
  usePresence: () => ({ onlineCount: 428 }),
}));

describe("HomePage", () => {
  it("renders four game surfaces, navigates on Tic Tac Toe, and keeps coming-soon titles inert", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        { path: "/", element: <HomePage /> },
        { path: "/play/tictactoe", element: <div>Mode stub</div> },
      ],
      { initialEntries: ["/"] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByRole("heading", { name: /neon arena/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/players online/i);

    expect(screen.getByRole("button", { name: /tic tac toe.*play now/i })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /chess.*coming soon/i })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /checkers.*coming soon/i })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /battleship.*coming soon/i })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /chess/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /tic tac toe.*play now/i }));
    expect(router.state.location.pathname).toBe("/play/tictactoe");
  });
});
