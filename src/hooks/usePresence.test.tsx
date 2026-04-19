import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { usePresence } from "@/hooks/usePresence";

const subscribeToCount = vi.fn<(cb: (count: number) => void) => () => void>();
const connect = vi.fn<(uid: string, nickname: string) => Promise<void>>();
const disconnect = vi.fn<(uid: string) => Promise<void>>();

vi.mock("@/lib/services", () => ({
  presenceService: {
    subscribeToCount: (cb: (count: number) => void) => subscribeToCount(cb),
    connect: (uid: string, nickname: string) => connect(uid, nickname),
    disconnect: (uid: string) => disconnect(uid),
  },
}));

function Probe() {
  const { onlineCount } = usePresence();
  return <span data-testid="count">{onlineCount}</span>;
}

describe("usePresence", () => {
  beforeEach(() => {
    subscribeToCount.mockImplementation((cb) => {
      cb(7);
      return () => undefined;
    });
    connect.mockResolvedValue(undefined);
    disconnect.mockResolvedValue(undefined);
    usePlayerStore.setState({ uid: "u1", nickname: "Neo" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to presence count on mount", () => {
    render(<Probe />);
    expect(subscribeToCount).toHaveBeenCalledTimes(1);
  });

  it("connects with uid and nickname", async () => {
    render(<Probe />);
    await waitFor(() => {
      expect(connect).toHaveBeenCalledWith("u1", "Neo");
    });
  });

  it("disconnects on unmount", async () => {
    const { unmount } = render(<Probe />);
    await waitFor(() => {
      expect(connect).toHaveBeenCalled();
    });
    unmount();
    await waitFor(() => {
      expect(disconnect).toHaveBeenCalledWith("u1");
    });
  });
});
