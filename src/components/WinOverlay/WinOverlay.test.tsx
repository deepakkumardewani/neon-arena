import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

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

import { WinOverlay } from "@/components/WinOverlay";

describe("WinOverlay", () => {
  it("renders YOU WIN and triggers callbacks", async () => {
    const user = userEvent.setup();
    const onPlayAgain = vi.fn();
    const onHome = vi.fn();
    const onAutoDismiss = vi.fn();
    render(
      <WinOverlay
        open
        headline="YOU WIN"
        palette="cyan"
        scoreWins={2}
        scoreLosses={1}
        scoreDraws={0}
        onPlayAgain={onPlayAgain}
        onHome={onHome}
        onAutoDismiss={onAutoDismiss}
      />,
    );
    expect(screen.getByText("YOU WIN")).toBeInTheDocument();
    expect(screen.getByText(/W: 2 \| L: 1 \| D: 0/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /play again/i }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /^home$/i }));
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it("renders YOU LOSE and DRAW", () => {
    const noop = (): void => undefined;
    const { rerender } = render(
      <WinOverlay
        open
        headline="YOU LOSE"
        palette="rose"
        scoreWins={0}
        scoreLosses={3}
        scoreDraws={1}
        onPlayAgain={noop}
        onHome={noop}
        onAutoDismiss={noop}
      />,
    );
    expect(screen.getByText("YOU LOSE")).toBeInTheDocument();
    rerender(
      <WinOverlay
        open
        headline="DRAW"
        palette="purple"
        scoreWins={1}
        scoreLosses={1}
        scoreDraws={2}
        onPlayAgain={noop}
        onHome={noop}
        onAutoDismiss={noop}
      />,
    );
    expect(screen.getByText("DRAW")).toBeInTheDocument();
  });

  it("auto-dismiss fires after 8 seconds", () => {
    vi.useFakeTimers();
    const onAutoDismiss = vi.fn();
    render(
      <WinOverlay
        open
        headline="DRAW"
        palette="purple"
        scoreWins={0}
        scoreLosses={0}
        scoreDraws={1}
        onPlayAgain={() => undefined}
        onHome={() => undefined}
        onAutoDismiss={onAutoDismiss}
      />,
    );
    vi.advanceTimersByTime(7999);
    expect(onAutoDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onAutoDismiss).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

afterEach(() => {
  vi.useRealTimers();
});
