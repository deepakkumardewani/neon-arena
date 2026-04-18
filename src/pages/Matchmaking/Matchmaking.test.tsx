import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { queueService } from "@/lib/services";

import { MatchmakingPage } from "@/pages/Matchmaking";

describe("MatchmakingPage", () => {
  beforeEach(() => {
    usePlayerStore.setState({ uid: "match-uid", nickname: "QueuePlayer" });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders title", () => {
    render(
      <MemoryRouter>
        <MatchmakingPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /matchmaking/i })).toBeInTheDocument();
  });

  it("calls dequeue with uid on unmount", () => {
    const dequeue = vi.spyOn(queueService, "dequeue");
    const { unmount } = render(
      <MemoryRouter>
        <MatchmakingPage />
      </MemoryRouter>,
    );
    unmount();
    expect(dequeue).toHaveBeenCalledWith("match-uid");
  });

  it("offers AI fallback after 30 seconds", async () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <MatchmakingPage />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/No opponent found/i)).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText(/No opponent found/i)).toBeInTheDocument();
  });
});
