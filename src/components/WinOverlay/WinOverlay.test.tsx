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
    render(
      <WinOverlay
        open
        headline="YOU WIN"
        palette="cyan"
        onPlayAgain={onPlayAgain}
        onHome={onHome}
      />,
    );
    expect(screen.getByText("YOU WIN")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /play again/i }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /^home$/i }));
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it("renders YOU LOSE and DRAW", () => {
    const noop = (): void => undefined;
    const { rerender } = render(
      <WinOverlay open headline="YOU LOSE" palette="rose" onPlayAgain={noop} onHome={noop} />,
    );
    expect(screen.getByText("YOU LOSE")).toBeInTheDocument();
    rerender(<WinOverlay open headline="DRAW" palette="purple" onPlayAgain={noop} onHome={noop} />);
    expect(screen.getByText("DRAW")).toBeInTheDocument();
  });

  it("stays open without user action after long idle (no auto-dismiss)", () => {
    vi.useFakeTimers();
    render(
      <WinOverlay
        open
        headline="YOU LOSE"
        palette="rose"
        onPlayAgain={() => undefined}
        onHome={() => undefined}
      />,
    );
    vi.advanceTimersByTime(30_000);
    expect(screen.getByText("YOU LOSE")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

afterEach(() => {
  vi.useRealTimers();
});
