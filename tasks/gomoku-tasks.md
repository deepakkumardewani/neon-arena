# Implementation Plan: Gomoku (Five in a Row)

## Overview

Add Gomoku as a first-class game in NeonArena. Same neon-cyberpunk aesthetic, same 4-mode structure (solo, local, online, friend), same routing shell, same Firebase backend. Tasks are ordered so each builds on the previous: types → engine → AI → state → components → page → online → settings → animations.

## Architecture Decisions

- **Intersection-based board**: `board[row][col]`, both 0-indexed — row 0 = top, col 0 = left. Immutable 2D arrays throughout.
- **Pure rules engine first**: all game logic lives in `src/lib/gomoku/engine/rules.ts` with zero React/Zustand deps; Zustand calls it.
- **Hard AI on a Web Worker**: threat-space search + alpha-beta runs off the UI thread via Vite's native worker import (`new Worker(new URL(...))`).
- **Reuse all Chess/Connect4 shared abstractions**: `GamePageShell`, `GameConfig`, `useGameSettings`, `useHintSystem`, `WinOverlay`, queue service.
- **No new shared abstractions**: every new symbol lives under `src/lib/gomoku/` or `src/components/gomoku/`.
- **patternScore.ts drives both AI and hint extraction**: the heuristic weights table is the single source of truth for board evaluation.
- **Framer Motion for animations**: stone placement spring, win-line draw-on, last-move indicator — all respect `useReducedMotion`.

---

## Task List

### Group 1 — Types & Config

---

- [ ] **T01: Core types + GameType extension**
      **Description:** Create `src/lib/gomoku/types.ts` with all Gomoku-specific types exactly as specified. Extend the `GameType` union in `src/types/game.ts` to include `"gomoku"`.
      **Acceptance criteria:**
  - `src/lib/gomoku/types.ts` exports: `StoneColor`, `GomokuCell`, `GomokuMove`, `WinLine`, `GomokuStatus`, `BoardSize`, `GomokuGameState`, `GomokuSettings`
  - `GameType` in `src/types/game.ts` includes `"gomoku"`
  - All types are `readonly`-safe; no `any`
  - `GomokuGameState.board` is `readonly (readonly (StoneColor | null)[])[]`
  - Project builds clean (`vp build`)
    **Dependencies:** None
    **Files:**
  - `src/lib/gomoku/types.ts` _(new)_
  - `src/types/game.ts`
    **Test targets:** Tier 2 — type-level tests via `tsc --noEmit`; no runtime tests needed for type declarations
    **Estimated scope:** XS

---

- [ ] **T02: gomokuConfig + route registration**
      **Description:** Create `src/pages/Gomoku/gomokuConfig.ts` (mirrors `chessConfig.ts`). Register the `/play/gomoku` route family in the router — `ModeSelectPage`, `NicknameEntryPage`, `MatchmakingPage` routes are shared; `GomokuGamePage` route is a stub that renders `<div>Gomoku</div>` for now. Add a Gomoku `GameCard` on the homepage.
      **Acceptance criteria:**
  - `gomokuConfig` has `gameType: "gomoku"`, all 4 modes, correct `routePrefix: "/play/gomoku"`
  - `/play/gomoku` renders `ModeSelectPage` with Gomoku title
  - `/play/gomoku/game` renders the stub page without crashing
  - `/game/gomoku/:gameId` route exists (stub)
  - Homepage `GameCard` for Gomoku navigates to `/play/gomoku`
  - `vp build` passes
    **Dependencies:** T01
    **Files:**
  - `src/pages/Gomoku/gomokuConfig.ts` _(new)_
  - `src/pages/Gomoku/GamePage.tsx` _(new — stub)_
  - `src/App.tsx` or router file _(add routes)_
  - `src/pages/Home/index.tsx` _(add GameCard)_
    **Test targets:** Tier 2 — smoke render test for the stub `GamePage`
    **Estimated scope:** S

---

### Group 2 — Rules Engine

---

- [ ] **T03: rules.ts — createInitialState + isLegalMove + listLegalMoves**
      **Description:** Implement the pure board helper functions in `src/lib/gomoku/engine/rules.ts`: `createInitialState`, `isLegalMove`, `listLegalMoves`.
      **Acceptance criteria:**
  - `createInitialState(size)` returns a valid `GomokuGameState`: all-`null` board of correct dimensions, `currentColor: "black"`, `status: "idle"`, all nullable fields `null`, `hintTokens: 3`
  - `isLegalMove(state, cell)` returns `false` if cell is out of bounds, already occupied, or game is not `"playing"` / `"idle"`
  - `listLegalMoves(state)` returns every `{row, col}` where `isLegalMove` is `true`
  - Board is treated as immutable throughout; no mutations
  - All three board sizes (9, 13, 15) produce correct dimensions
    **Dependencies:** T01
    **Files:**
  - `src/lib/gomoku/engine/rules.ts` _(new)_
    **Test targets:** Tier 1 — full branch coverage: occupied cell rejected, out-of-bounds rejected, game-not-playing rejected, correct cell count for each board size
    **Estimated scope:** S

---

- [ ] **T04: rules.ts — placeStone + detectWin**
      **Description:** Implement `placeStone` and `detectWin` in `rules.ts`. `detectWin` scans only through `lastCell` in all four directions (horizontal, vertical, diagonal-asc, diagonal-desc) — no full-board scan. Returns the `WinLine` (≥5 cells) or `null`.
      **Acceptance criteria:**
  - `placeStone(state, cell)` updates `board`, appends to `history`, switches `currentColor`, sets `lastMove`, calls `detectWin` to update `winLine`, `winner`, and `status`
  - After a winning placement: `status: "finished"`, `winner` is the placing color, `winLine` holds the exact cells
  - `detectWin` returns correct `WinLine` for horizontal, vertical, diagonal-asc, and diagonal-desc wins
  - `detectWin` returns `null` when fewer than 5 consecutive same-color stones exist through `lastCell`
  - Freestyle rules: 6-in-a-row or longer still counts as a win (no exact-five restriction)
  - Placing on an occupied or out-of-bounds cell returns state unchanged
  - `status` transitions from `"idle"` → `"playing"` on first stone placement
    **Dependencies:** T03
    **Files:**
  - `src/lib/gomoku/engine/rules.ts`
    **Test targets:** Tier 1 — horizontal win, vertical win, diagonal-asc win, diagonal-desc win, near-win (4 in a row), 6-in-a-row counts, occupied cell no-op, history grows correctly
    **Estimated scope:** M

---

- [ ] **T05: rules.ts — isGameOver + checkDraw**
      **Description:** Implement `isGameOver` and draw detection in `rules.ts`. Wire draw detection into `placeStone` so it sets `status: "finished"` and `winner: "draw"` when the board is full with no winner.
      **Acceptance criteria:**
  - `isGameOver(state)` returns `true` when `status === "finished"`
  - `checkDraw(board, size)` returns `true` iff all `size × size` cells are non-null
  - `placeStone` on a board where last cell fills the board with no winner produces `winner: "draw"`, `status: "finished"`, `winLine: null`
  - Win takes precedence over draw (if last stone wins, `winner` is the color, not `"draw"`)
    **Dependencies:** T04
    **Files:**
  - `src/lib/gomoku/engine/rules.ts`
    **Test targets:** Tier 1 — full board no winner → draw, full board last-move wins → win not draw, partial board → false
    **Estimated scope:** XS

---

### Group 3 — AI

---

- [ ] **T06: patternScore.ts — heuristic weights**
      **Description:** Implement `src/lib/gomoku/engine/patternScore.ts`. Exports `PATTERN_WEIGHTS` and `scoreBoard(board, color, size)` which evaluates all line segments and returns a numeric score for `color` minus score for the opponent.
      **Acceptance criteria:**
  - `PATTERN_WEIGHTS` exports: `five: Infinity`, `openFour: 10_000`, `blockedFour: 1_000`, `openThree: 500`, `blockedThree: 100`, `openTwo: 50`, `blockedTwo: 10`
  - `scoreBoard` scans all horizontal, vertical, and both diagonal runs through the board; detects and weights each pattern type
  - Returns `Infinity` if color has five in a row; returns `-Infinity` if opponent does
  - Pure function — no side effects, no mutation
  - Handles edge-of-board boundary conditions (blocked patterns at edges correctly classified as "blocked")
    **Dependencies:** T01
    **Files:**
  - `src/lib/gomoku/engine/patternScore.ts` _(new)_
    **Test targets:** Tier 1 — open-four scores higher than blocked-four, five returns Infinity, edge-blocked three classified as blockedThree, opponent five returns -Infinity
    **Estimated scope:** M

---

- [ ] **T07: aiEasy.ts — random strategy**
      **Description:** Implement `src/lib/gomoku/engine/aiEasy.ts`. Exports `chooseMove(state: GomokuGameState): GomokuCell` — picks a uniformly random intersection from candidates within 2 cells of any existing stone. Empty board: defaults to near-center.
      **Acceptance criteria:**
  - Never returns a cell where `isLegalMove` is `false`
  - Candidate window: all empty intersections within Chebyshev distance 2 of any placed stone
  - Empty board: returns a cell within the center 3×3 of the board
  - Returns a valid cell on any non-terminal board
    **Dependencies:** T03
    **Files:**
  - `src/lib/gomoku/engine/aiEasy.ts` _(new)_
    **Test targets:** Tier 1 — returns legal cell, never picks occupied cell, handles near-full board (1 legal cell), empty board returns center region
    **Estimated scope:** XS

---

- [ ] **T08: aiMedium.ts — greedy pattern strategy**
      **Description:** Implement `src/lib/gomoku/engine/aiMedium.ts`. Priority: (1) win immediately, (2) block opponent's open-four (one move from winning), (3) score all candidate cells using `patternScore`; pick highest.
      **Acceptance criteria:**
  - If any move wins immediately (creates five in a row), plays it
  - If opponent has an open-four, blocks it
  - Otherwise scores all candidates (window: within 2 of any stone) with `scoreBoard` and plays the best
  - Correctly handles multiple simultaneous threats (win > block > heuristic priority)
  - Candidate window is always restricted (never exhausts full board)
    **Dependencies:** T04, T06
    **Files:**
  - `src/lib/gomoku/engine/aiMedium.ts` _(new)_
    **Test targets:** Tier 1 — immediate win detection, open-four block detection, heuristic pick when no threat, win overrides block when both available
    **Estimated scope:** S

---

- [ ] **T09: aiHard.ts — threat-space search + alpha-beta**
      **Description:** Implement `src/lib/gomoku/engine/aiHard.ts`. Threat-space search: enumerate forced sequences from critical threats (fours, threes), prune non-threatening branches, alpha-beta on reduced tree. Falls back to pattern-score pick when no threats exist. Accepts optional `{ maxDepth?: number }` for hint extraction at depth 4.
      **Acceptance criteria:**
  - Returns a legal cell on any non-terminal board
  - Wins immediately when a one-move win is available
  - Blocks an opponent open-four before any non-critical move
  - Completes within 2s on a 15×15 board with typical mid-game density (verified in timing test)
  - `chooseMove(state, options?)` accepts `{ maxDepth?: number }` override
  - Move candidates always restricted to a window around existing stones (never full 225-cell board)
    **Dependencies:** T04, T06
    **Files:**
  - `src/lib/gomoku/engine/aiHard.ts` _(new)_
    **Test targets:** Tier 1 — returns legal move, wins when one-move-win available, blocks forced loss, timing assertion < 2000ms at default depth on 15×15
    **Estimated scope:** L

---

- [ ] **T10: ai.ts + difficultyMap.ts + Web Worker + useGomokuAI**
      **Description:** Create `src/lib/gomoku/engine/ai.ts` (difficulty router), `difficultyMap.ts` (config constants), `src/lib/gomoku/engine/ai.worker.ts` (Web Worker wrapper for Hard AI), and `useGomokuAI` hook in `src/lib/gomoku/engine/useGomokuAI.ts`.
      **Acceptance criteria:**
  - `difficultyMap.ts` exports `DIFFICULTY_CONFIG` with entries: `easy: { strategy: "random", thinkMs: 400, maxDepth: 0 }`, `medium: { strategy: "greedy-pattern", thinkMs: 600, maxDepth: 2 }`, `hard: { strategy: "threat-space", thinkMs: 1200, maxDepth: 6 }`
  - `ai.ts` routes to correct strategy based on `Difficulty`
  - Hard AI calls are dispatched to the worker; Easy/Medium run inline
  - `useGomokuAI(state, difficulty)` returns `{ isThinking }`, triggers `store.placeStone` after `thinkMs` delay on AI's turn
  - Worker created via `new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' })`
    **Dependencies:** T07, T08, T09, T12
    **Files:**
  - `src/lib/gomoku/engine/difficultyMap.ts` _(new)_
  - `src/lib/gomoku/engine/ai.ts` _(new)_
  - `src/lib/gomoku/engine/ai.worker.ts` _(new)_
  - `src/lib/gomoku/engine/useGomokuAI.ts` _(new)_
    **Test targets:** Tier 1 — router calls correct strategy; `useGomokuAI` triggers move after delay (mock timers); worker message round-trip
    **Estimated scope:** M

---

### Group 4 — State

---

- [ ] **T11: gomokuReducer.ts — pure state transitions**
      **Description:** Implement `src/lib/gomoku/state/gomokuReducer.ts`. Pure `(state, action) => state` — no side effects. Actions: `PLACE_STONE`, `UNDO_MOVE`, `RESET_GAME`, `HOVER_CELL`, `SET_HINT`, `CLEAR_HINT`.
      **Acceptance criteria:**
  - `PLACE_STONE` delegates to `rules.placeStone`; no-ops when `isLegalMove` is false or game is finished
  - `UNDO_MOVE` reverts last move (solo: undo player + AI pair = 2 moves; local: undo 1 move); no-ops if `history` empty
  - `RESET_GAME` returns `createInitialState(size)` but preserves `hintTokens: 3`; accepts optional `size` to change board size
  - `HOVER_CELL` / `SET_HINT` / `CLEAR_HINT` are simple field updates
  - All actions return new state object; input state is never mutated
    **Dependencies:** T05
    **Files:**
  - `src/lib/gomoku/state/gomokuReducer.ts` _(new)_
    **Test targets:** Tier 1 — each action type, undo at empty history, undo in solo (removes 2) vs local (removes 1), reset preserves token count, PLACE_STONE no-op on finished game
    **Estimated scope:** M

---

- [ ] **T12: useGomokuStore.ts — Zustand store**
      **Description:** Implement `src/lib/gomoku/state/useGomokuStore.ts`. Wraps the reducer; exposes `hoverCell`, `placeStone`, `undoMove`, `requestHint`, `clearHint`, `resetGame`.
      `requestHint` deducts a token, runs `aiHard.chooseMove` at `maxDepth: 4`, sets `hintCell`, schedules `clearHint` after `HINT_DISPLAY_MS`.
      **Acceptance criteria:**
  - Store state reflects all reducer transitions
  - `requestHint` no-ops when `hintTokens === 0`
  - `requestHint` calls `aiHard.chooseMove(state, { maxDepth: 4 })` and stores result in `hintCell`
  - `clearHint` nulls `hintCell`
  - `hintTokens` decrements by 1 on each successful `requestHint`
    **Dependencies:** T11, T09
    **Files:**
  - `src/lib/gomoku/state/useGomokuStore.ts` _(new)_
    **Test targets:** Tier 1 — hint token decrement, hint no-op at 0 tokens, hintCell set then cleared after delay, placeStone no-op on finished game
    **Estimated scope:** M

---

### Group 5 — Settings

---

- [ ] **T13: GomokuSettings + useGameSettings wiring**
      **Description:** Create `GomokuSettings` default values and wire `useGameSettings<GomokuSettings>` (reuse existing Chess hook) with `localStorage` key `neon-arena:gomoku-settings`.
      **Acceptance criteria:**
  - Default settings: `defaultBoardSize: 15`, `showLastMove: true`, `showCoordinates: true`, `allowUndo: true`, `hintsEnabled: true`, `autoHintDelayMs: 30_000`
  - Settings persist across page refresh
  - `useGomokuSettings()` convenience hook exported from `src/lib/gomoku/state/`
  - Partial override merges correctly (missing keys fall back to defaults)
    **Dependencies:** T01
    **Files:**
  - `src/lib/gomoku/state/useGomokuSettings.ts` _(new)_
    **Test targets:** Tier 1 — default values, persistence round-trip, partial override merges correctly
    **Estimated scope:** XS

---

- [ ] **T14: SettingsPanel — Gomoku section**
      **Description:** Add a "Gomoku" collapsible section to the existing `SettingsPanel` component with the 6 settings from the spec.
      **Acceptance criteria:**
  - Default board size picker: 9×9 / 13×13 / 15×15 (default 15×15), renders only when `mode === "solo" || mode === "local"`
  - Show Last Move toggle (default ON)
  - Show Coordinates toggle (default ON)
  - Allow Undo toggle (default ON)
  - Hints toggle (default ON)
  - Auto-hint delay dropdown: Off / 15s / 30s / 60s (default 30s)
  - All controls persist via `useGomokuSettings`
  - Section only renders when `gameType === "gomoku"` context is active
    **Dependencies:** T13
    **Files:**
  - `src/components/SettingsPanel/index.tsx`
  - `src/lib/gomoku/state/useGomokuSettings.ts`
    **Test targets:** Tier 2 — smoke render; each toggle/dropdown renders without crash
    **Estimated scope:** S

---

### Group 6 — Hints

---

- [ ] **T15: hintConfig.ts + useGomokuHintSystem wiring**
      **Description:** Create `src/lib/gomoku/hints/hintConfig.ts` with the spec's constants. Wire `useHintSystem` (reused from Chess/Connect4) into the Gomoku store layer via a thin adapter hook `useGomokuHintSystem`.
      **Acceptance criteria:**
  - `hintConfig.ts` exports `HINT_TOKENS_PER_GAME = 3`, `AUTO_HINT_INACTIVITY_MS = 30_000`, `HINT_DISPLAY_MS = 3_000`
  - `useGomokuHintSystem` calls `useHintSystem` with `onRequestHint: store.requestHint`
  - Auto-hint fires only on the human player's turn (never during AI thinking)
  - `secondsUntilAutoHint` surfaced for HUD countdown
    **Dependencies:** T12
    **Files:**
  - `src/lib/gomoku/hints/hintConfig.ts` _(new)_
  - `src/lib/gomoku/hints/useGomokuHintSystem.ts` _(new)_
    **Test targets:** Tier 1 — auto-hint does not fire during AI turn, timer resets on user activity, tokens enforced via store
    **Estimated scope:** S

---

### Group 7 — Components

---

- [ ] **T16: Stone.tsx — Black / White stone with glow**
      **Description:** Implement `src/components/gomoku/GomokuBoard/Stone.tsx`. Renders a single Gomoku stone in Black or White with neon glow effect, inner highlight dot, optional last-move center dot, and optional winning-stone pulse state.
      **Acceptance criteria:**
  - Black stone: radial gradient `#1a1a1a → #000`, glow `--na-fg` at low opacity, inner highlight dot
  - White stone: radial gradient `#e8e8e8 → #bbb`, glow `white` at low opacity, inner highlight dot
  - `isLastMove` prop: small cyan center dot rendered on top of stone
  - `isWinning` prop: stone pulses at 1.5Hz via CSS animation
  - `isDesaturated` prop (non-winning stones post-win): 40% opacity
  - Stone diameter: fills the cell minus ~15% padding
  - Respects `prefers-reduced-motion` (no pulse, static bright opacity for wins)
    **Dependencies:** T01
    **Files:**
  - `src/components/gomoku/GomokuBoard/Stone.tsx` _(new)_
    **Test targets:** Tier 2 — renders Black stone, renders White stone, renders winning state, renders desaturated state without crash
    **Estimated scope:** S

---

- [ ] **T17: Intersection.tsx — single intersection with hover / stone states**
      **Description:** Implement `src/components/gomoku/GomokuBoard/Intersection.tsx`. Renders one grid intersection: the crosshair lines, an optional placed stone, ghost hover preview, and hint highlight. Hit area ≥ 24px on touch.
      **Acceptance criteria:**
  - Empty intersection: crosshair lines (thin, warm-tan or `--na-surface-2`), transparent background
  - Star-point intersections: small filled circle at the correct positions for each board size
  - Hover (desktop): translucent ghost stone in current player's color (40% opacity) — only when empty and game is `"playing"`
  - `stone` prop: renders `<Stone color={stone} isLastMove={isLastMove} isWinning={isWinning} isDesaturated={isDesaturated} />`
  - `isHint` prop: pulsing cyan ghost-stone outline at 2Hz
  - Hit area: `min-w-[24px] min-h-[24px]` with transparent padding beyond visible lines
  - Click dispatches `onPlace(cell)` only when empty and not disabled
    **Dependencies:** T16
    **Files:**
  - `src/components/gomoku/GomokuBoard/Intersection.tsx` _(new)_
    **Test targets:** Tier 2 — renders empty, renders with stone, click fires handler, click no-op when stone present, click no-op when disabled
    **Estimated scope:** S

---

- [ ] **T18: WinLine.tsx — animated neon highlight over 5-in-a-row**
      **Description:** Implement `src/components/gomoku/GomokuBoard/WinLine.tsx`. Receives `winLine` (5+ `GomokuCell` coords + direction) and renders an SVG neon line drawn on from the first to the last winning cell. 400ms ease-out draw-on animation.
      **Acceptance criteria:**
  - SVG overlay positioned absolute over the board; pointer-events none
  - Line color matches the winner's stone color with strong `filter: drop-shadow` glow
  - `strokeDasharray` + `strokeDashoffset` draw-on animation: 400ms, ease-out
  - Covers all 4 directions: horizontal, vertical, diagonal-asc, diagonal-desc
  - `prefers-reduced-motion`: instant full stroke, no animation
  - Mounts and unmounts cleanly via `AnimatePresence`; no layout shift
    **Dependencies:** T01
    **Files:**
  - `src/components/gomoku/GomokuBoard/WinLine.tsx` _(new)_
    **Test targets:** Tier 2 — renders without crash for each direction, mounts/unmounts without errors
    **Estimated scope:** S

---

- [ ] **T19: BoardSizePicker/index.tsx — 9×9 / 13×13 / 15×15 selector**
      **Description:** Implement `src/components/gomoku/BoardSizePicker/index.tsx`. Radio-button style neon panel for selecting board size before the first move in solo and local modes.
      **Acceptance criteria:**
  - Three options: 9×9, 13×13, 15×15 (neon pill buttons, radio semantics)
  - Default selection reads from `GomokuSettings.defaultBoardSize` (15)
  - Selection persists to `useGomokuSettings().defaultBoardSize` on change
  - Only shown in solo + local modes; hidden in online + friend modes
  - Disabled once the first stone is placed (`history.length > 0`)
    **Dependencies:** T13
    **Files:**
  - `src/components/gomoku/BoardSizePicker/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders all 3 options, default selection matches settings, disabled state applied when history non-empty
    **Estimated scope:** XS

---

- [ ] **T20: GomokuBoard/index.tsx — grid layout + interaction**
      **Description:** Implement `src/components/gomoku/GomokuBoard/index.tsx`. Renders the full N×N intersection grid using `Intersection` components. Wires hover, click, coordinate labels, star points, and win-line overlay from store state.
      **Acceptance criteria:**
  - Grid: N×N intersections rendered; board uses `aspect-ratio: 1/1`, fits `min(90vw, 600px)` container
  - Intersection hit areas ≥ 24px on touch (enforced at `Intersection` level)
  - Column labels A–O and row labels 1–N render at edges when `showCoordinates` is ON; hidden when OFF
  - Star points at correct positions: 15×15 → center + 4 corners at row/col 3 and 11; 13×13 and 9×9 equivalents
  - Hover dispatches `store.hoverCell(cell)`; mouse-leave dispatches `store.hoverCell(null)`
  - Click dispatches `store.placeStone(cell)` via `onPlace`
  - All interaction disabled during `isThinking`, or when `status !== "playing"`
  - `WinLine` renders as overlay when `winLine` is present
    **Dependencies:** T17, T18, T12
    **Files:**
  - `src/components/gomoku/GomokuBoard/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders correct number of intersections for each board size, click dispatches correct cell, disabled state prevents dispatch
    **Estimated scope:** M

---

- [ ] **T21: GomokuHUD/index.tsx — turn indicator + tokens + undo**
      **Description:** Implement `src/components/gomoku/GomokuHUD/index.tsx`. Shows active player color chip, move counter, hint token icons, optional undo button, and coordinate toggle.
      **Acceptance criteria:**
  - Turn indicator chip shows current player color (Black / White) and name/nickname; pulses in the stone's glow color
  - Move counter: "Move 14"
  - 3 hint token icons (filled → empty as used); button disabled at 0 tokens
  - Undo button visible only when `settings.allowUndo && (mode === "solo" || mode === "local")`; disabled when `history.length === 0`
  - Coordinate toggle button shown when `showCoordinates` setting is active; toggles setting on click
  - Online: HUD reorders so local user appears on top/left
    **Dependencies:** T12, T15
    **Files:**
  - `src/components/gomoku/GomokuHUD/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders without crash, hint button disabled at 0 tokens, undo hidden in online mode
    **Estimated scope:** S

---

### Group 8 — Animations

---

- [ ] **T22: Stone placement animation**
      **Description:** Animate stone placement in `Intersection.tsx` / `Stone.tsx`. Stone scales from 0.6 → 1.0 with opacity 0 → 1 (180ms, spring stiffness 300 damping 26). Outer glow pulse on placement for 400ms via CSS keyframes.
      **Acceptance criteria:**
  - `framer-motion` `motion.div` wraps each `Stone`; `initial={{ scale: 0.6, opacity: 0 }}` → `animate={{ scale: 1, opacity: 1 }}`
  - Spring config: `stiffness: 300, damping: 26`
  - CSS `@keyframes` glow pulse plays for 400ms after stone mounts
  - `prefers-reduced-motion`: instant opacity snap, no scale animation, no pulse
  - No layout shift; stones remain pixel-aligned to intersections
    **Dependencies:** T17
    **Files:**
  - `src/components/gomoku/GomokuBoard/Stone.tsx`
  - `src/components/gomoku/GomokuBoard/Intersection.tsx`
    **Test targets:** Tier 2 — stone mounts without crash; reduced-motion skips animation (mock `useReducedMotion`)
    **Estimated scope:** S

---

- [ ] **T23: Win line draw-on + winning-stone pulse animation**
      **Description:** Implement the win-line draw-on and winning-stone pulse animations. Win line: `strokeDashoffset` animates from full length → 0 over 400ms ease-out. Winning stones: pulse at 1.5Hz for 1.5s post-line completion. All non-winning stones drop to 40% opacity (200ms).
      **Acceptance criteria:**
  - Win line draw-on: 400ms ease-out, correct for all 4 directions
  - Winning stones pulse at 1.5Hz via CSS animation that starts after the 400ms line animation completes (sequential: line first, pulse second)
  - Non-winning placed stones: `opacity` transitions to 0.4 over 200ms
  - `WinOverlay` mounts (reuse existing) after animations finish
  - `prefers-reduced-motion`: instant full line, instant opacity change, no pulse
    **Dependencies:** T18, T16
    **Files:**
  - `src/components/gomoku/GomokuBoard/WinLine.tsx`
  - `src/components/gomoku/GomokuBoard/Stone.tsx`
    **Test targets:** Tier 2 — winning stone renders pulse class; desaturated stone renders reduced-opacity class; reduced-motion skips animation
    **Estimated scope:** S

---

- [ ] **T24: Last-move indicator + hint highlight animations**
      **Description:** Animate the last-move center dot and the hint intersection highlight. Last-move dot: fades in 120ms on new stone; previous dot fades out simultaneously. Hint highlight: pulsing ghost-stone outline at 2Hz, opacity 0.4 → 0.9 → 0.4; fade in 200ms, hold, fade out 200ms via `AnimatePresence`.
      **Acceptance criteria:**
  - Last-move cyan dot: `AnimatePresence` keyed to `lastMove` cell coordinates; old dot fades out as new one fades in (120ms each)
  - Hint ghost outline: CSS `@keyframes` pulse at 2Hz while `hintCell` is set
  - Hint outline uses `AnimatePresence` for mount/unmount fade (200ms each end)
  - Hint layer renders above ghost-hover layer but below placed stones (z-order from spec)
  - `prefers-reduced-motion`: last-move dot instant show/hide; hint outline static opacity, no pulse
    **Dependencies:** T17, T15
    **Files:**
  - `src/components/gomoku/GomokuBoard/Intersection.tsx`
  - `src/components/gomoku/GomokuBoard/Stone.tsx`
    **Test targets:** Tier 2 — last-move dot renders on correct cell, hint outline renders when `isHint` set, reduced-motion skips pulse
    **Estimated scope:** S

---

### Group 9 — Page

---

- [ ] **T25: GomokuGamePage — solo + local modes**
      **Description:** Replace the stub `GamePage.tsx` with a real implementation handling solo (vs AI) and local (pass-and-play) game modes. Wire: store, AI hook, board, HUD, board-size picker, settings, hints, win overlay.
      **Acceptance criteria:**
  - Solo mode: AI plays as White after each human (Black) move; difficulty from mode select
  - Local mode: alternating human turns; no AI; both players are human
  - Game starts in `"idle"` state; `BoardSizePicker` shown; first stone placement transitions to `"playing"`
  - Undo works per mode (solo = undo player + AI pair, local = undo 1 move)
  - Win/draw shows `WinOverlay` (reused); overlay has "Play again" → `resetGame`
  - Settings panel accessible; board-size change restarts game via `resetGame(newSize)`
  - Hint system active in solo mode; disabled/hidden in local mode
  - `GamePageShell` wraps the page (particles, banner, route guards)
  - Acceptance criteria AC1–AC14, AC17–AC19, AC21–AC22 from spec are met
    **Dependencies:** T10, T12, T20, T21, T14, T15, T19
    **Files:**
  - `src/pages/Gomoku/GamePage.tsx`
    **Test targets:** Tier 2 — page renders solo mode, page renders local mode, AI move fires after human move (mock AI hook), BoardSizePicker hidden after first stone
    **Estimated scope:** L

---

### Group 10 — Online

---

- [ ] **T26: gomokuGameMappers.ts — Firebase serialization**
      **Description:** Implement `src/lib/gomoku/online/gomokuGameMappers.ts`. Converts between `GomokuOnlineDoc` (Firebase RTDB schema) and `GomokuGameState`.
      **Acceptance criteria:**
  - `docToState(doc)` correctly maps `board` (2D array), `history`, `currentColor`, `winner`, `winLine` → `GomokuGameState`
  - `stateToDoc(state, move)` produces the exact patch fields: `{ board, currentColor, history, winner, winLine, lastMoveAt }`
  - Round-trip: `docToState(stateToDoc(state))` ≈ original state
  - Board serialization handles `null` cells correctly (not `undefined`)
  - `winLine` serializes/deserializes `direction` enum correctly
    **Dependencies:** T01
    **Files:**
  - `src/lib/gomoku/online/gomokuGameMappers.ts` _(new)_
    **Test targets:** Tier 1 — round-trip fidelity, null cell handling, winLine direction mapping, winner mapping (black / white / "draw" / null)
    **Estimated scope:** S

---

- [ ] **T27: gomokuGameService.ts — RTDB service**
      **Description:** Implement `src/lib/gomoku/online/gomokuGameService.ts`. Mirrors `chessGameService.ts` / `connect4GameService.ts` structure. Implements: `createGomokuGame`, `joinGomokuGame`, `commitMove`, `subscribeGomokuGame`, `resignGame`.
      **Acceptance criteria:**
  - `createGomokuGame` writes to `/games/gomoku/{gameId}` with `status: "waiting"`, `gameType: "gomoku"`, `boardSize: 15`
  - `commitMove` atomically patches: `{ board, currentColor, history, winner, winLine, lastMoveAt }`
  - `subscribeGomokuGame` uses `onValue` and calls callback on every update
  - `resignGame` sets `status: "finished"` and `winner` to the non-resigning color
  - `gameType: "gomoku"` on all documents (prevents cross-game queue matching; AC20)
    **Dependencies:** T26
    **Files:**
  - `src/lib/gomoku/online/gomokuGameService.ts` _(new)_
    **Test targets:** Tier 1 — `commitMove` patch shape is correct, `resignGame` sets correct winner, mappers called in correct order
    **Estimated scope:** M

---

- [ ] **T28: GomokuGamePage — online + friend modes**
      **Description:** Extend `GamePage.tsx` to handle online (matchmaking) and friend (direct invite) modes. Wire Firebase subscription, real-time sync, and resign flow.
      **Acceptance criteria:**
  - Online mode: subscribes to Firebase doc; only the active player's color writes; moves sync within 300ms (AC15)
  - `ConnectionLostBanner` shown on disconnect (reuse existing)
  - Resign button in online/friend modes; opponent sees result immediately
  - Local player always shown on top/left of HUD
  - `gameType: "gomoku"` queue entries do not cross-match with other games (AC20)
  - `BoardSizePicker` hidden in online/friend modes (fixed 15×15)
  - AC15, AC19, AC20 from spec are met
    **Dependencies:** T25, T27
    **Files:**
  - `src/pages/Gomoku/GamePage.tsx`
  - `src/lib/gomoku/online/gomokuGameService.ts`
    **Test targets:** Tier 2 — page renders in online mode stub, resign dispatches correct service call (mocked Firebase)
    **Estimated scope:** L

---

## Summary

| #   | Task                                                         | Group      | Scope | Deps                              |
| --- | ------------------------------------------------------------ | ---------- | ----- | --------------------------------- |
| T01 | Core types + GameType extension                              | Types      | XS    | —                                 |
| T02 | gomokuConfig + route registration                            | Types      | S     | T01                               |
| T03 | rules.ts — createInitialState + isLegalMove + listLegalMoves | Engine     | S     | T01                               |
| T04 | rules.ts — placeStone + detectWin                            | Engine     | M     | T03                               |
| T05 | rules.ts — isGameOver + checkDraw                            | Engine     | XS    | T04                               |
| T06 | patternScore.ts — heuristic weights                          | AI         | M     | T01                               |
| T07 | aiEasy.ts — random strategy                                  | AI         | XS    | T03                               |
| T08 | aiMedium.ts — greedy pattern strategy                        | AI         | S     | T04, T06                          |
| T09 | aiHard.ts — threat-space + alpha-beta                        | AI         | L     | T04, T06                          |
| T10 | ai.ts + difficultyMap + Web Worker + useGomokuAI             | AI         | M     | T07–T09, T12                      |
| T11 | gomokuReducer.ts — pure state transitions                    | State      | M     | T05                               |
| T12 | useGomokuStore.ts — Zustand store                            | State      | M     | T11, T09                          |
| T13 | GomokuSettings + useGameSettings wiring                      | Settings   | XS    | T01                               |
| T14 | SettingsPanel — Gomoku section                               | Settings   | S     | T13                               |
| T15 | hintConfig.ts + useGomokuHintSystem wiring                   | Hints      | S     | T12                               |
| T16 | Stone.tsx — Black / White stone with glow                    | Components | S     | T01                               |
| T17 | Intersection.tsx — single intersection                       | Components | S     | T16                               |
| T18 | WinLine.tsx — animated neon 5-in-a-row highlight             | Components | S     | T01                               |
| T19 | BoardSizePicker/index.tsx                                    | Components | XS    | T13                               |
| T20 | GomokuBoard/index.tsx — grid + interaction                   | Components | M     | T17, T18, T12                     |
| T21 | GomokuHUD/index.tsx — turn indicator + tokens + undo         | Components | S     | T12, T15                          |
| T22 | Stone placement animation                                    | Animations | S     | T17                               |
| T23 | Win line draw-on + winning-stone pulse                       | Animations | S     | T18, T16                          |
| T24 | Last-move indicator + hint highlight animations              | Animations | S     | T17, T16                          |
| T25 | GomokuGamePage — solo + local modes                          | Page       | L     | T10, T12, T20, T21, T14, T15, T19 |
| T26 | gomokuGameMappers.ts — Firebase serialization                | Online     | S     | T01                               |
| T27 | gomokuGameService.ts — RTDB service                          | Online     | M     | T26                               |
| T28 | GomokuGamePage — online + friend modes                       | Page       | L     | T25, T27                          |

**Total tasks: 28** | XS: 5 | S: 12 | M: 7 | L: 4

---

## Completion Checklist

- [ ] T01 — [ ] Impl — [ ] Test
- [ ] T02 — [ ] Impl — [ ] Test
- [ ] T03 — [ ] Impl — [ ] Test
- [ ] T04 — [ ] Impl — [ ] Test
- [ ] T05 — [ ] Impl — [ ] Test
- [ ] T06 — [ ] Impl — [ ] Test
- [ ] T07 — [ ] Impl — [ ] Test
- [ ] T08 — [ ] Impl — [ ] Test
- [ ] T09 — [ ] Impl — [ ] Test
- [ ] T10 — [ ] Impl — [ ] Test
- [ ] T11 — [ ] Impl — [ ] Test
- [ ] T12 — [ ] Impl — [ ] Test
- [ ] T13 — [ ] Impl — [ ] Test
- [ ] T14 — [ ] Impl — [ ] Test
- [ ] T15 — [ ] Impl — [ ] Test
- [ ] T16 — [ ] Impl — [ ] Test
- [ ] T17 — [ ] Impl — [ ] Test
- [ ] T18 — [ ] Impl — [ ] Test
- [ ] T19 — [ ] Impl — [ ] Test
- [ ] T20 — [ ] Impl — [ ] Test
- [ ] T21 — [ ] Impl — [ ] Test
- [ ] T22 — [ ] Impl — [ ] Test
- [ ] T23 — [ ] Impl — [ ] Test
- [ ] T24 — [ ] Impl — [ ] Test
- [ ] T25 — [ ] Impl — [ ] Test
- [ ] T26 — [ ] Impl — [ ] Test
- [ ] T27 — [ ] Impl — [ ] Test
- [ ] T28 — [ ] Impl — [ ] Test
