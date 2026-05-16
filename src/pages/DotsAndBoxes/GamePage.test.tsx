import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { DotsAndBoxesGamePage } from "./GamePage";
import * as dotsStore from "@/lib/dotsAndBoxes/state/useDotsStore";
import * as dotsSettings from "@/lib/dotsAndBoxes/state/useDotsSettings";
import * as dotsAI from "@/lib/dotsAndBoxes/engine/useDotsAI";
import * as dotsHints from "@/lib/dotsAndBoxes/hints/useDotsHintSystem";
import { createInitialState } from "@/lib/dotsAndBoxes/engine/rules";

// Mock components to avoid rendering complexity
vi.mock("@/components/dotsAndBoxes/DotsBoard", () => ({
  DotsBoard: ({ isDisabled }: any) => (
    <div data-testid="dots-board" data-disabled={String(isDisabled)} />
  ),
}));

vi.mock("@/components/dotsAndBoxes/DotsHUD", () => ({
  DotsHUD: () => <div data-testid="dots-hud" />,
}));

vi.mock("@/components/dotsAndBoxes/ScoreBoard", () => ({
  DotsScoreBoard: () => <div data-testid="dots-scoreboard" />,
}));

vi.mock("@/components/dotsAndBoxes/BoardSizePicker", () => ({
  BoardSizePicker: ({ mode, hasStarted }: any) =>
    hasStarted || mode !== "solo" ? null : <div data-testid="board-size-picker" />,
}));

vi.mock("@/components/WinOverlay", () => ({
  GameEndOverlay: ({ presentation }: any) =>
    presentation?.open ? <div data-testid="win-overlay">Win!</div> : null,
}));

vi.mock("@/components/SettingsPanel", () => ({
  SettingsPanel: ({ open }: any) => (open ? <div data-testid="settings-panel" /> : null),
  DotsSettingsSection: () => <div data-testid="dots-settings-section" />,
}));

vi.mock("@/components/ConnectionLostBanner", () => ({
  ConnectionLostBanner: () => <div data-testid="connection-lost-banner" />,
}));

describe("DotsAndBoxesGamePage", () => {
  const initialState = createInitialState({ rows: 5, cols: 5 });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock store
    vi.spyOn(dotsStore, "useDotsStore").mockImplementation((selector) => {
      const mockState = initialState;
      const mockStore = {
        ...mockState,
        hoverEdge: vi.fn(),
        claimEdge: vi.fn(),
        undoMove: vi.fn(),
        requestHint: vi.fn(),
        clearHint: vi.fn(),
        resetGame: vi.fn(),
      };
      return selector ? selector(mockStore as any) : mockStore;
    });

    // Mock settings
    vi.spyOn(dotsSettings, "useDotsSettings").mockImplementation((selector) => {
      const mockSettings = {
        defaultSize: { rows: 5, cols: 5 },
        showLastMove: true,
        allowUndo: true,
        hintsEnabled: true,
        autoHintDelayMs: 30000,
        animationSpeedMs: 0,
        updateSetting: vi.fn(),
      };
      return selector ? selector(mockSettings as any) : mockSettings;
    });

    // Mock AI hook
    vi.spyOn(dotsAI, "useDotsAI").mockReturnValue({
      isThinking: false,
    });

    // Mock hint system
    vi.spyOn(dotsHints, "useDotsHintSystem").mockReturnValue({
      secondsUntilAutoHint: null,
      onUserActivity: vi.fn(),
      canHint: true,
    });
  });

  it("should render solo mode game page", () => {
    render(
      <MemoryRouter initialEntries={["/game/dots-and-boxes?mode=solo&difficulty=medium"]}>
        <Routes>
          <Route path="/game/dots-and-boxes" element={<DotsAndBoxesGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("dots-board")).toBeInTheDocument();
    expect(screen.getByTestId("dots-hud")).toBeInTheDocument();
    expect(screen.getByTestId("dots-scoreboard")).toBeInTheDocument();
  });

  it("should render board size picker in solo mode before game starts", () => {
    render(
      <MemoryRouter initialEntries={["/game/dots-and-boxes?mode=solo"]}>
        <Routes>
          <Route path="/game/dots-and-boxes" element={<DotsAndBoxesGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("board-size-picker")).toBeInTheDocument();
  });

  it("should render local mode game page", () => {
    render(
      <MemoryRouter initialEntries={["/game/dots-and-boxes?mode=local"]}>
        <Routes>
          <Route path="/game/dots-and-boxes" element={<DotsAndBoxesGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("dots-board")).toBeInTheDocument();
    expect(screen.getByTestId("dots-hud")).toBeInTheDocument();
  });

  it("should disable board when AI is thinking in solo mode", () => {
    vi.spyOn(dotsAI, "useDotsAI").mockReturnValue({
      isThinking: true,
    });

    // Mock state with AI turn
    vi.spyOn(dotsStore, "useDotsStore").mockImplementation((selector) => {
      const mockState = {
        ...initialState,
        currentPlayer: 2 as const,
      };
      const mockStore = {
        ...mockState,
        hoverEdge: vi.fn(),
        claimEdge: vi.fn(),
        undoMove: vi.fn(),
        requestHint: vi.fn(),
        clearHint: vi.fn(),
        resetGame: vi.fn(),
      };
      return selector ? selector(mockStore as any) : mockStore;
    });

    render(
      <MemoryRouter initialEntries={["/game/dots-and-boxes?mode=solo&difficulty=easy"]}>
        <Routes>
          <Route path="/game/dots-and-boxes" element={<DotsAndBoxesGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    const board = screen.getByTestId("dots-board");
    expect(board).toHaveAttribute("data-disabled", "true");
  });

  it("should show win overlay when game is finished", () => {
    vi.spyOn(dotsStore, "useDotsStore").mockImplementation((selector) => {
      const mockState = {
        ...initialState,
        status: "finished" as const,
        winner: 1 as const,
      };
      const mockStore = {
        ...mockState,
        hoverEdge: vi.fn(),
        claimEdge: vi.fn(),
        undoMove: vi.fn(),
        requestHint: vi.fn(),
        clearHint: vi.fn(),
        resetGame: vi.fn(),
      };
      return selector ? selector(mockStore as any) : mockStore;
    });

    render(
      <MemoryRouter initialEntries={["/game/dots-and-boxes?mode=solo"]}>
        <Routes>
          <Route path="/game/dots-and-boxes" element={<DotsAndBoxesGamePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("win-overlay")).toBeInTheDocument();
  });
});
