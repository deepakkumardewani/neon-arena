import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vite-plus/test";

import { HomePage } from "@/pages/Home";

vi.mock("@/components/ParticleBackground", () => ({
  ParticleBackground: () => null,
}));

vi.mock("@/hooks/usePresenceCount", () => ({
  usePresenceCount: () => ({ onlineCount: 428 }),
}));

describe("HomePage", () => {
  it("renders game cards, navigates on Tic Tac Toe and Connect 4, keeps coming-soon cards inert", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        { path: "/", element: <HomePage /> },
        { path: "/play/tictactoe", element: <div>Mode stub</div> },
        { path: "/play/connect4", element: <div>Connect4 stub</div> },
      ],
      { initialEntries: ["/"] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByRole("heading", { name: /neon arena/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/players online/i);

    expect(screen.getByRole("button", { name: /tic tac toe.*play now/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /connect 4.*play now/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/chess.*coming soon/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/checkers.*coming soon/i)).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /chess/i })).toBeNull();

    await user.click(screen.getByRole("button", { name: /tic tac toe.*play now/i }));
    expect(router.state.location.pathname).toBe("/play/tictactoe");

    // Navigate back to home and test Connect 4 navigation
    await router.navigate("/");
    await user.click(await screen.findByRole("button", { name: /connect 4.*play now/i }));
    expect(router.state.location.pathname).toBe("/play/connect4");
  });
});
