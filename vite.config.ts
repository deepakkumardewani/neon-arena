import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // `vp test run --coverage` may print a Vitest “mixed versions” warning: `vitest` is
    // aliased to `@voidzero-dev/vite-plus-test` (npm semver 0.1.x) while `@vitest/coverage-v8`
    // reports 4.1.x. The runner still bundles Vitest 4.1.x; the warning is a false positive.
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: [
        "src/lib/game/logic.ts",
        "src/lib/ai/easy.ts",
        "src/lib/ai/medium.ts",
        "src/lib/ai/minimax.ts",
      ],
    },
  },
  fmt: {
    ignorePatterns: [
      ".claude/**",
      "features/**",
      "CLAUDE.md",
      "AGENTS.md",
      "node_modules/**",
      "dist/**",
      "public/**",
    ],
  },
  lint: {
    ignorePatterns: [
      ".claude/**",
      "features/**",
      "CLAUDE.md",
      "AGENTS.md",
      "node_modules/**",
      "dist/**",
      "public/**",
    ],
    options: { typeAware: true, typeCheck: true },
  },
});
