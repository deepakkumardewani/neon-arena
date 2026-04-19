import { describe, expect, it } from "vite-plus/test";

import { buildGameShareUrl } from "@/lib/online/gameShareUrl";

describe("Friend lobby share URL", () => {
  it("buildGameShareUrl matches current origin pattern", () => {
    expect(buildGameShareUrl("abc-123", "https://neonarena.app")).toBe(
      "https://neonarena.app/game/abc-123",
    );
  });
});
