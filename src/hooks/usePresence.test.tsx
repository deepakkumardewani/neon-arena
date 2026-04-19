import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { usePresenceCount } from "@/hooks/usePresenceCount";

const subscribeToCount = vi.fn<(cb: (count: number) => void) => () => void>();

vi.mock("@/lib/services/presence", () => ({
  presenceService: {
    subscribeToCount: (cb: (count: number) => void) => subscribeToCount(cb),
  },
}));

function Probe() {
  const { onlineCount } = usePresenceCount();
  return <span data-testid="count">{onlineCount}</span>;
}

describe("usePresenceCount", () => {
  beforeEach(() => {
    subscribeToCount.mockImplementation((cb) => {
      cb(7);
      return () => undefined;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to presence count on mount", () => {
    render(<Probe />);
    expect(subscribeToCount).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("count")).toHaveTextContent("7");
  });
});
