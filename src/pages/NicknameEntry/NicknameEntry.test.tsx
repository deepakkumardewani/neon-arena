import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { usePlayerStore } from "@/hooks/usePlayerStore";

vi.mock("@/lib/services", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/services")>();
  return {
    ...mod,
    authService: {
      getCurrentUser: vi.fn(() => null),
      signInAnonymously: vi.fn(() => Promise.resolve({ uid: "test-user" })),
      onAuthStateChanged: vi.fn(() => (): void => undefined),
    },
  };
});

import { NicknameEntryPage } from "@/pages/NicknameEntry";

function renderNickname(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/play/tictactoe/nickname" element={<NicknameEntryPage />} />
        <Route path="/play/tictactoe/game" element={<p>Game screen</p>} />
        <Route path="/play/tictactoe/matchmaking" element={<p>Matchmaking</p>} />
        <Route path="/play/tictactoe" element={<p>Mode select</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NicknameEntryPage", () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState({
      nickname: "",
      localGuestNickname: "Player 2",
      uid: "",
      role: null,
      score: { uid: "", nickname: "", wins: 0, losses: 0, draws: 0 },
    });
  });

  it("renders context for solo mode", () => {
    renderNickname("/play/tictactoe/nickname?mode=solo&difficulty=hard");
    expect(screen.getByRole("heading", { name: /enter nickname/i })).toBeInTheDocument();
    expect(screen.getByText(/vs AI — Hard/i)).toBeInTheDocument();
  });

  it("single-player flow continues to game with nickname saved", async () => {
    const user = userEvent.setup();
    renderNickname("/play/tictactoe/nickname?mode=solo&difficulty=easy");

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "SoloHero");

    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(screen.getByText("Game screen")).toBeInTheDocument();
    });
    expect(usePlayerStore.getState().nickname).toBe("SoloHero");
    expect(usePlayerStore.getState().uid).toBe("test-user");
  });

  it("local 2P sequential flow collects both nicknames then opens game", async () => {
    const user = userEvent.setup();
    renderNickname("/play/tictactoe/nickname?mode=local");

    const p1 = screen.getByRole("textbox");
    await user.clear(p1);
    await user.type(p1, "FirstName");
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(screen.getByText(/player 2/i)).toBeInTheDocument();

    const p2 = screen.getByRole("textbox");
    await user.clear(p2);
    await user.type(p2, "SecondX");
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(screen.getByText("Game screen")).toBeInTheDocument();
    });
    expect(usePlayerStore.getState().nickname).toBe("FirstName");
    expect(usePlayerStore.getState().localGuestNickname).toBe("SecondX");
  });

  it("redirects to mode select when mode query is missing", async () => {
    renderNickname("/play/tictactoe/nickname");
    await waitFor(() => {
      expect(screen.getByText("Mode select")).toBeInTheDocument();
    });
  });
});
