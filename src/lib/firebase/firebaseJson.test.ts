import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vite-plus/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("firebase.json", () => {
  it("points Firestore rules at firestore.rules", () => {
    const root = path.resolve(__dirname, "../../..");
    const raw = readFileSync(path.join(root, "firebase.json"), "utf8");
    const parsed = JSON.parse(raw) as {
      firestore?: { rules?: string };
      database?: { rules?: string };
    };
    expect(parsed.firestore?.rules).toBe("firestore.rules");
    expect(parsed.database?.rules).toBe("database.rules.json");
  });
});
