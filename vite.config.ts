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
  },
  fmt: {
    ignorePatterns: [
      ".claude/**",
      "features/**",
      "CLAUDE.md",
      "AGENTS.md",
      "node_modules/**",
      "dist/**",
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
    ],
    options: { typeAware: true, typeCheck: true },
  },
});
