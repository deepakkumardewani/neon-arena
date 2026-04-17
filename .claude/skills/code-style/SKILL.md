---
name: code-style
description: >
  Use this skill for naming conventions and code style rules. Covers PascalCase,
  camelCase, ALL_CAPS conventions for components, files, variables,
  functions, constants, and TypeScript-specific patterns.
---

# Code Style

## Naming Conventions

| Entity                               | Convention      | Example                          |
| ------------------------------------ | --------------- | -------------------------------- |
| Components, interfaces, type aliases | PascalCase      | `UserProfile`, `ApiResponse`     |
| Variables, functions, methods        | camelCase       | `getUserData`, `isLoading`       |
| Private class members                | Prefix with `_` | `_privateMethod`                 |
| Constants                            | ALL_CAPS        | `MAX_RETRY_COUNT`                |
| Other source file names (lib, etc.)  | camelCase       | `pickMove.ts`, `audioManager.ts` |

## File Naming Rules

| File type        | Convention              | Example                                     |
| ---------------- | ----------------------- | ------------------------------------------- |
| Components       | PascalCase `.tsx`       | `GameBoard.tsx` or `GameBoard/index.tsx`    |
| Component tests  | PascalCase `.test.tsx`  | `GameBoard.test.tsx`, `WinOverlay.test.tsx` |
| Hooks            | camelCase `.ts`         | `useGameStore.ts`, `useReducedMotion.ts`    |
| Actions          | `actions.ts`            | always this name, per feature folder        |
| Types            | `types.ts`              | always this name, per feature folder        |
| Helpers          | `helpers.ts`            | always this name, per feature folder        |
| Other TS modules | pascalCase when generic | `firebaseClient.ts`                         |

Hook files use **camelCase** and typically match the primary export (e.g. file `useGameStore.ts` exports `useGameStore`).

## TypeScript Conventions

- Use `interface` for object shapes and component props
- Use `type` for unions, intersections, and `z.infer<>` exports
- Never use `any` or `unknown`

## Related References

- `.claude/skills/typescript-best-practices/SKILL.md` — full TypeScript patterns
