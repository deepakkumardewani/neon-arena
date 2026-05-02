import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vite-plus/test";

import { ModeSelectPage } from "@/pages/ModeSelect";
import { tictactoeConfig } from "@/pages/TicTacToeGame/tictactoeConfig";

describe("ModeSelectPage", () => {
  it("navigates to nickname with expected search params per mode", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        { path: "/play/tictactoe", element: <ModeSelectPage gameConfig={tictactoeConfig} /> },
        { path: "/play/tictactoe/nickname", element: <div>Nickname stub</div> },
      ],
      { initialEntries: ["/play/tictactoe"] },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByRole("heading", { name: /choose mode/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^vs ai/i }));
    await user.click(screen.getByRole("button", { name: /^hard$/i }));
    expect(router.state.location.pathname).toBe("/play/tictactoe/nickname");
    expect(router.state.location.search).toContain("mode=solo");
    expect(router.state.location.search).toContain("difficulty=hard");
  });

  it("routes local play to nickname with mode=local", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        { path: "/play/tictactoe", element: <ModeSelectPage gameConfig={tictactoeConfig} /> },
        { path: "/play/tictactoe/nickname", element: <div>Nickname stub</div> },
      ],
      { initialEntries: ["/play/tictactoe"] },
    );

    render(<RouterProvider router={router} />);

    await user.click(screen.getByRole("button", { name: /local 2p/i }));
    expect(router.state.location.pathname).toBe("/play/tictactoe/nickname");
    expect(router.state.location.search).toContain("mode=local");
  });
});
