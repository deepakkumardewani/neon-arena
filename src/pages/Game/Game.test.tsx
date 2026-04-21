import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { ConfirmProvider } from "@/components/ui/confirm";
import { useGameStore } from "@/hooks/useGameStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import type { ScoreDoc } from "@/types/player";

vi.mock("@/lib/ai/pick-move", () => ({
  pickAiMove: vi.fn(),
}));

vi.mock("@tsparticles/react", () => ({
  __esModule: true,
  default: () => null,
  initParticlesEngine: () => Promise.resolve(),
}));

vi.mock("@tsparticles/slim", () => ({
  loadSlim: () => Promise.resolve(),
}));

vi.mock("@tsparticles/plugin-emitters", () => ({
  loadEmittersPlugin: () => Promise.resolve(),
}));

import { pickAiMove } from "@/lib/ai/pick-move";
import { GamePage } from "@/pages/Game";

const emptyScore = (): ScoreDoc => ({
  uid: "",
  nickname: "",
  wins: 0,
  losses: 0,
  draws: 0,
});

function renderGame(initial = "/play/tictactoe/game?mode=solo&difficulty=easy") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <ConfirmProvider>
        <Routes>
          <Route path="/play/tictactoe/game" element={<GamePage />} />
        </Routes>
      </ConfirmProvider>
    </MemoryRouter>,
  );
}

describe("GamePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(pickAiMove).mockReset();
    usePlayerStore.setState({
      nickname: "Hero",
      localGuestNickname: "Guest",
      uid: "",
      role: null,
      score: emptyScore(),
    });
    useGameStore.getState().resetGame();
    useGameStore.setState({ mode: "solo", difficulty: "easy" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes an accessible game title", () => {
    renderGame();
    expect(screen.getByRole("heading", { name: /^game$/i, hidden: true })).toBeInTheDocument();
  });

  it("plays a full vs-AI game to completion with deterministic AI moves", async () => {
    vi.useFakeTimers();
    vi.mocked(pickAiMove).mockReturnValueOnce(4).mockReturnValueOnce(3).mockReturnValueOnce(8);

    renderGame();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /row 1 column 1, empty/i }));
      await vi.advanceTimersByTimeAsync(700);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /row 1 column 2, empty/i }));
      await vi.advanceTimersByTimeAsync(700);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /row 1 column 3, empty/i }));
    });

    expect(screen.getByText("YOU WIN")).toBeInTheDocument();
    expect(useGameStore.getState().status).toBe("win");
  });
});
