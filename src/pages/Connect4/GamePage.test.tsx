import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vite-plus/test";

import { Connect4GamePage } from "./GamePage";

// Worker is not available in jsdom
vi.stubGlobal(
  "Worker",
  class {
    onmessage: ((e: MessageEvent) => void) | null = null;
    postMessage() {}
    terminate() {}
  },
);

// Mock Firebase connected hook
vi.mock("@/hooks/useFirebaseConnected", () => ({
  useFirebaseConnected: () => true,
}));

// Mock online hook
const mockUseConnect4Online = vi.fn((_opts?: any) => ({
  commitMoveToFirebase: vi.fn(),
  resignGame: vi.fn(),
  acceptRematch: vi.fn(),
  declineRematch: vi.fn(),
  notifyLeaveGame: vi.fn(),
  myPlayerId: null,
  p1Name: "Player 1",
  p2Name: "Player 2",
}));

vi.mock("@/lib/connect4/online/useConnect4Online", () => ({
  useConnect4Online: (opts: { gameId?: string; mode: string }) => mockUseConnect4Online(opts),
}));

function renderPage(search = "?mode=solo&difficulty=medium") {
  return render(
    <MemoryRouter initialEntries={[`/play/connect4/game${search}`]}>
      <Routes>
        <Route path="/play/connect4/game" element={<Connect4GamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderFriendGame(gameId: string) {
  return render(
    <MemoryRouter initialEntries={[`/game/connect4/${gameId}`]}>
      <Routes>
        <Route path="/game/connect4/:gameId" element={<Connect4GamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Connect4GamePage", () => {
  it("renders solo mode without crashing", () => {
    renderPage("?mode=solo&difficulty=medium");
    expect(screen.getByText("← Connect 4")).toBeInTheDocument();
    expect(screen.getByText(/solo/i)).toBeInTheDocument();
  });

  it("renders local mode without crashing", () => {
    renderPage("?mode=local");
    expect(screen.getByText("← Connect 4")).toBeInTheDocument();
    expect(screen.getByText(/local/i)).toBeInTheDocument();
  });

  it("renders online mode without crashing", () => {
    render(
      <MemoryRouter initialEntries={["/play/connect4/game?mode=online"]}>
        <Routes>
          <Route path="/play/connect4/game" element={<Connect4GamePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("← Connect 4")).toBeInTheDocument();
    expect(screen.getByText(/online/i)).toBeInTheDocument();
  });

  it("shows AI label in solo mode", () => {
    renderPage("?mode=solo&difficulty=easy");
    expect(screen.getAllByText(/AI \(easy\)/i).length).toBeGreaterThan(0);
  });

  it("shows player labels in local mode", () => {
    renderPage("?mode=local");
    expect(screen.getAllByText("Player 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Player 2").length).toBeGreaterThan(0);
  });

  it("renders settings button", () => {
    renderPage();
    expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
  });

  it("hides undo in online mode (no undo button)", () => {
    renderPage("?mode=online");
    // Undo section should not be rendered in online mode
    expect(screen.queryByLabelText("Undo last move")).not.toBeInTheDocument();
  });

  it("shows resign button in friend mode with gameId", () => {
    const { container } = renderFriendGame("test-game-id");
    // Check that the Resign button appears in the DOM
    expect(container.textContent).toContain("Resign");
  });
});
