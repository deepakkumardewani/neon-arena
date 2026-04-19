import { describe, expect, it, vi } from "vite-plus/test";

type ConnectionSnap = { val: () => boolean };

vi.mock("firebase/database", () => ({
  ref: vi.fn(() => ({})),
  onValue: vi.fn((_ref: object, cb: (snap: ConnectionSnap) => void) => {
    cb({ val: () => true });
    return vi.fn();
  }),
}));

import type { Database } from "firebase/database";

import { subscribeRtdbConnected } from "./subscribeRtdbConnected";

describe("subscribeRtdbConnected", () => {
  it("subscribes and reports connection state", () => {
    const onChange = vi.fn();
    const unsub = subscribeRtdbConnected({} as Database, onChange);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(typeof unsub).toBe("function");
  });
});
