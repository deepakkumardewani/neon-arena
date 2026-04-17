---
name: vite-plus
description: Unified toolchain for the web built on top of Vite. Use when working with `vp` commands, running the dev server, building, testing, linting, formatting, managing dependencies, or executing monorepo tasks in a Vite+ project.
---

# Vite+ Skill

Vite+ is a unified toolchain that wraps Vite, Vitest, Oxlint, Oxfmt, and tsdown under a single `vp` CLI. It is **distinct from Vite** — always use `vp` commands, never invoke the underlying tools directly.

---

## Command Reference

### Start
| Command | Description |
|---------|-------------|
| `vp create` | Create a new project from a template |
| `vp config` | Configure hooks and agent integration |
| `vp staged` | Run linters on staged files |
| `vp install` / `vp i` | Install dependencies |
| `vp env` | Manage Node.js versions |

### Develop
| Command | Description |
|---------|-------------|
| `vp dev` | Run the development server |
| `vp check` | Run format, lint, and TypeScript type checks |
| `vp lint` | Lint code |
| `vp fmt` | Format code |
| `vp test` | Run tests (via bundled Vitest) |

### Execute
| Command | Description |
|---------|-------------|
| `vp run <script>` | Run a monorepo / package.json task |
| `vp exec <bin>` | Execute a binary from `node_modules/.bin` |
| `vp dlx <pkg>` | Execute a package binary without installing it |
| `vp cache` | Manage the task cache |

### Build
| Command | Description |
|---------|-------------|
| `vp build` | Build for production |
| `vp pack` | Build libraries |
| `vp preview` | Preview production build |

### Manage Dependencies
Vite+ auto-detects the underlying package manager (`pnpm`, `npm`, `yarn`) via `packageManager` in `package.json` or lockfiles.

| Command | Aliases | Description |
|---------|---------|-------------|
| `vp add` | | Add packages to dependencies |
| `vp remove` | `rm`, `un`, `uninstall` | Remove packages |
| `vp update` | `up` | Update packages to latest |
| `vp list` | `ls` | List installed packages |
| `vp why` | `explain` | Show why a package is installed |
| `vp info` | `view`, `show` | View package info from registry |

> Use `vp help` to list all commands. Use `vp <command> --help` for details on a specific command.

---

## Critical Rules — Common Pitfalls

1. **Never use the package manager directly.** Do not run `pnpm`, `npm`, or `yarn` directly. Always use `vp add`, `vp remove`, etc.

2. **Never use `vp vitest` or `vp oxlint`.** These do not exist. Use `vp test` and `vp lint` instead.

3. **`vp run` vs built-in commands.** Built-in commands like `vp dev` always invoke the Vite+ built-in tool, not a `package.json` script of the same name. To run a custom `dev` script (e.g. one that starts multiple services), use `vp run dev`.

4. **Never install Vitest, Oxlint, Oxfmt, or tsdown directly.** Vite+ bundles these tools. Installing them separately will cause version conflicts.

5. **Use `vp dlx` instead of `npx` or package-manager `dlx`.** For one-off binaries, always use `vp dlx <pkg>`.

6. **Import from `vite-plus`, not from `vite` or `vitest`.** All module imports must reference the project's `vite-plus` dependency:
   ```ts
   // ✅ Correct
   import { defineConfig } from 'vite-plus';
   import { expect, test, vi } from 'vite-plus/test';

   // ❌ Wrong
   import { defineConfig } from 'vite';
   import { expect, test, vi } from 'vitest';
   ```

7. **Type-aware linting is built in.** Run `vp lint --type-aware` directly — no need to install `oxlint-tsgolint`.

8. **Check the version when researching docs/bugs.** Run `vp --version` to get the exact version of the underlying tools, then look up the correct docs for that version.
