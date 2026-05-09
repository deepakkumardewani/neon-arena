# Implementation Plan: Connect 4

## Overview

Add Connect 4 as a first-class game in NeonArena. Same neon-cyberpunk aesthetic, same 4-mode structure (solo, local, online, friend), same routing shell, same Firebase backend. Tasks are ordered so each builds on the previous: types → engine → AI → state → components → page → online → settings → animations.

## Architecture Decisions

- **Column-major board storage**: `board[col][row]`, row 0 = bottom, row 5 = top — gravity is trivially `getDropRow`.
- **Pure rules engine first**: all game logic lives in `src/lib/connect4/engine/rules.ts` with zero React/Zustand deps; Zustand calls it.
- **Hard AI on a Web Worker**: minimax + alpha-beta runs off the UI thread via Vite's native worker import (`new Worker(new URL(...))`).
- **Reuse all Chess shared abstractions**: `GamePageShell`, `GameConfig`, `useGameSettings`, `useHintSystem`, `WinOverlay`, queue service.
- **No new shared abstractions**: every new symbol lives under `src/lib/connect4/` or `src/components/connect4/`.
- **Framer Motion for animations**: disc fall, win glow, hover arrow — all respect `useReducedMotion`.

---

## Task List

### Group 1 — Types & Config

---

- [x] **T01: Core types + GameType extension**
      **Description:** Create `src/lib/connect4/types.ts` with all Connect 4–specific types exactly as specified. Extend the `GameType` union in `src/types/game.ts` to include `"connect4"`.
      **Acceptance criteria:**
  - `src/lib/connect4/types.ts` exports: `PlayerId`, `CellValue`, `Board`, `Connect4Move`, `WinResult`, `Connect4Status`, `Connect4GameState`, `Connect4Settings`
  - `GameType` in `src/types/game.ts` is `"tictactoe" | "chess" | "connect4"`
  - All types are `readonly`-safe; no `any`
  - Project builds clean (`vp build`)
    **Dependencies:** None
    **Files:**
  - `src/lib/connect4/types.ts` _(new)_
  - `src/types/game.ts`
    **Test targets:** Tier 2 — type-level tests via `tsc --noEmit`; no runtime tests needed for type declarations
    **Estimated scope:** XS

---

- [x] **T02: connect4Config + route registration**
      **Description:** Create `src/pages/Connect4/connect4Config.ts` (mirrors `chessConfig.ts`). Register the `/play/connect4` route family in the router — `ModeSelectPage`, `NicknameEntryPage`, `MatchmakingPage` routes are shared; `Connect4GamePage` route is a stub that renders `<div>Connect 4</div>` for now. Add a Connect 4 `GameCard` on the homepage.
      **Acceptance criteria:**
  - `connect4Config` has `gameType: "connect4"`, all 4 modes, correct `routePrefix`
  - `/play/connect4` renders `ModeSelectPage` with Connect 4 title
  - `/play/connect4/game` renders the stub page without crashing
  - `/game/connect4/:gameId` route exists (stub)
  - Homepage GameCard for Connect 4 navigates to `/play/connect4`
  - `vp build` passes
    **Dependencies:** T01
    **Files:**
  - `src/pages/Connect4/connect4Config.ts` _(new)_
  - `src/pages/Connect4/GamePage.tsx` _(new — stub)_
  - `src/App.tsx` or router file _(add routes)_
  - `src/pages/Home/index.tsx` _(add GameCard)_
    **Test targets:** Tier 2 — smoke render test for the stub `GamePage`
    **Estimated scope:** S

---

### Group 2 — Rules Engine

---

- [x] **T03: rules.ts — board helpers**
      **Description:** Implement the pure board helper functions in `src/lib/connect4/engine/rules.ts`: `createInitialState`, `isColumnFull`, `listLegalColumns`, `getDropRow`.
      **Acceptance criteria:**
  - `createInitialState()` returns a valid `Connect4GameState` with 7 columns × 6 rows all `null`, `currentPlayer: 1`, `status: "idle"`, all nullable fields `null`, `hintTokens: 3`
  - `isColumnFull(board, col)` returns `true` iff column has no `null` cell
  - `listLegalColumns(board)` returns all cols where `!isColumnFull`
  - `getDropRow(board, col)` returns the lowest `null` row index (0 = bottom); returns `-1` if full
  - Board is treated as immutable throughout; no mutations
    **Dependencies:** T01
    **Files:**
  - `src/lib/connect4/engine/rules.ts` _(new)_
    **Test targets:** Tier 1 — full branch coverage: full column, partial column, empty column, all-full board
    **Estimated scope:** S

---

- [x] **T04: rules.ts — dropDisc + checkWin**
      **Description:** Implement `dropDisc` and `checkWin` in `rules.ts`. `checkWin` scans 4 directions (horizontal, vertical, ↗, ↘) through the newly placed cell, counting consecutive same-player discs up to 3 cells in each opposite ray.
      **Acceptance criteria:**
  - `dropDisc(state, col)` places the disc at `getDropRow`, transitions `currentPlayer`, appends to `history`, sets `status: "playing"`
  - After a winning drop: `status: "finished"`, `winResult` holds winner + 4 cell coords
  - `checkWin` returns `null` when < 4 in a row; returns correct `WinResult` for horizontal, vertical, and both diagonals
  - Dropping into a full column returns state unchanged (no-op)
  - `animatingDisc` field is set on drop (from top row to `toRow`)
    **Dependencies:** T03
    **Files:**
  - `src/lib/connect4/engine/rules.ts`
    **Test targets:** Tier 1 — horizontal win, vertical win, diagonal ↗ win, diagonal ↘ win, near-win (3 in a row, no win), full column no-op, `history` grows correctly
    **Estimated scope:** M

---

- [x] **T05: rules.ts — checkDraw**
      **Description:** Implement `checkDraw` in `rules.ts`. Also wire `checkDraw` into `dropDisc` so it sets `isDraw: true` and `status: "finished"` when the board is full with no winner.
      **Acceptance criteria:**
  - `checkDraw(board)` returns `true` iff all 42 cells are non-null
  - `dropDisc` on a board with 41 filled cells (no win) sets `isDraw: true`, `status: "finished"`, `winResult: null`
  - Win takes precedence over draw (if last disc wins, `isDraw` stays `false`)
    **Dependencies:** T04
    **Files:**
  - `src/lib/connect4/engine/rules.ts`
    **Test targets:** Tier 1 — full board with no winner, full board where last move wins, partial board returns false
    **Estimated scope:** XS

---

### Group 3 — AI

---

- [x] **T06: aiEasy.ts — random strategy**
      **Description:** Implement `src/lib/connect4/engine/aiEasy.ts`. Exports `chooseColumn(state: Connect4GameState): number` — picks a uniformly random column from `listLegalColumns`.
      **Acceptance criteria:**
  - Never returns a column index where `isColumnFull` is true
  - Returns a valid column on any non-full board
  - On an empty board, distribution is roughly uniform across 7 columns (statistical, not deterministic)
    **Dependencies:** T03
    **Files:**
  - `src/lib/connect4/engine/aiEasy.ts` _(new)_
    **Test targets:** Tier 1 — returns legal column, never picks full column, handles near-full board (1 legal column)
    **Estimated scope:** XS

---

- [x] **T07: aiMedium.ts — heuristic strategy**
      **Description:** Implement `src/lib/connect4/engine/aiMedium.ts`. Priority: (1) win immediately, (2) block opponent's immediate win, (3) center-weighted score (col 3 = 6, cols 2&4 = 4, cols 1&5 = 2, cols 0&6 = 1).
      **Acceptance criteria:**
  - If AI can win by dropping in col X, returns col X
  - If opponent would win by dropping in col Y (and AI can't win), returns col Y
  - Otherwise returns highest center-score legal column
  - Correctly handles multiple simultaneous win/block candidates (picks first found is fine)
    **Dependencies:** T04
    **Files:**
  - `src/lib/connect4/engine/aiMedium.ts` _(new)_
    **Test targets:** Tier 1 — immediate win detection, immediate block detection, center preference when no threat, double-threat (win > block priority)
    **Estimated scope:** S

---

- [x] **T08: aiHard.ts — minimax + alpha-beta**
      **Description:** Implement `src/lib/connect4/engine/aiHard.ts`. Minimax with alpha-beta pruning, `maxDepth: 8`. Evaluation: center-column occupancy + threat count (3-in-a-row with open end). Move ordering: center columns first for better cutoffs. Hint extraction uses depth 6.
      **Acceptance criteria:**
  - Returns a legal column on any non-terminal board
  - Beats `aiMedium` consistently (not tested deterministically — spot-check in code review)
  - Completes within 1.5s on a cold start empty board at depth 8 (verified in timing test)
  - `chooseColumn` accepts optional `{ maxDepth?: number }` override for hint extraction
    **Dependencies:** T04
    **Files:**
  - `src/lib/connect4/engine/aiHard.ts` _(new)_
    **Test targets:** Tier 1 — returns legal move, wins when one-move-win is available, blocks a forced loss, timing assertion < 1500ms at depth 8
    **Estimated scope:** L

---

- [x] **T09: ai.ts + difficultyMap.ts + Web Worker**
      **Description:** Create `src/lib/connect4/engine/ai.ts` (difficulty router), `difficultyMap.ts` (config constants), and `src/lib/connect4/engine/ai.worker.ts` (Web Worker wrapper for Hard AI). Create `useConnect4AI` hook in `src/lib/connect4/engine/useConnect4AI.ts`.
      **Acceptance criteria:**
  - `difficultyMap.ts` exports `DIFFICULTY_CONFIG` with easy/medium/hard entries (thinkMs, strategy, maxDepth)
  - `ai.ts` routes to correct strategy based on `Difficulty`
  - Hard AI calls are dispatched to the worker; Easy/Medium run inline
  - `useConnect4AI(state, difficulty)` returns `{ isThinking }`, triggers `store.dropDisc` after `thinkMs` delay on AI's turn
  - Worker is created via `new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' })`
    **Dependencies:** T06, T07, T08, T11
    **Files:**
  - `src/lib/connect4/engine/difficultyMap.ts` _(new)_
  - `src/lib/connect4/engine/ai.ts` _(new)_
  - `src/lib/connect4/engine/ai.worker.ts` _(new)_
  - `src/lib/connect4/engine/useConnect4AI.ts` _(new)_
    **Test targets:** Tier 1 — router calls correct strategy; `useConnect4AI` triggers move after delay (mock timers); worker message round-trip
    **Estimated scope:** M

---

### Group 4 — State

---

- [x] **T10: connect4Reducer.ts — pure state transitions**
      **Description:** Implement `src/lib/connect4/state/connect4Reducer.ts`. Pure `(state, action) => state` — no side effects. Actions: `DROP_DISC`, `UNDO_MOVE`, `RESET_GAME`, `HOVER_COLUMN`, `SET_HINT`, `CLEAR_HINT`, `SET_ANIMATING_DISC`, `CLEAR_ANIMATING_DISC`.
      **Acceptance criteria:**
  - `DROP_DISC` delegates to `rules.dropDisc`; no-ops on `status !== "playing"` or full column
  - `UNDO_MOVE` reverts last move (solo: undo player + AI pair; local: undo 1 move); no-ops if `history` empty
  - `RESET_GAME` returns `createInitialState()` but preserves `hintTokens` at 3
  - `HOVER_COLUMN` / `SET_HINT` / `CLEAR_HINT` are simple field updates
  - All actions return new state object; input state is never mutated
    **Dependencies:** T05
    **Files:**
  - `src/lib/connect4/state/connect4Reducer.ts` _(new)_
    **Test targets:** Tier 1 — each action type, undo at empty history, undo in solo vs local mode, reset preserves token count
    **Estimated scope:** M

---

- [x] **T11: useConnect4Store.ts — Zustand store**
      **Description:** Implement `src/lib/connect4/state/useConnect4Store.ts`. Wraps the reducer; exposes `hoverColumn`, `dropDisc`, `undoMove`, `requestHint`, `clearHint`, `resetGame`. `requestHint` deducts a token, runs `aiHard.chooseColumn` at depth 6, sets `hintCol`, schedules `clearHint` after `HINT_DISPLAY_MS`.
      **Acceptance criteria:**
  - Store state reflects all reducer transitions
  - `requestHint` no-ops when `hintTokens === 0`
  - `requestHint` calls hard AI with `{ maxDepth: 6 }` and stores result in `hintCol`
  - `clearHint` nulls `hintCol`
  - `dropDisc` dispatches `SET_ANIMATING_DISC` before the disc state update; calls `CLEAR_ANIMATING_DISC` after `animationSpeedMs × rowsTravelled` ms
    **Dependencies:** T10, T08
    **Files:**
  - `src/lib/connect4/state/useConnect4Store.ts` _(new)_
    **Test targets:** Tier 1 — hint token decrement, hint no-op at 0 tokens, animatingDisc set/clear timing, dropDisc no-op on full column
    **Estimated scope:** M

---

### Group 5 — Settings

---

- [x] **T12: Connect4Settings + useGameSettings wiring**
      **Description:** Create `Connect4Settings` default values and wire `useGameSettings<Connect4Settings>` (reuse existing Chess hook) with `localStorage` key `neon-arena:connect4-settings`.
      **Acceptance criteria:**
  - Default settings: `showLastMove: true`, `allowUndo: true`, `hintsEnabled: true`, `autoHintDelayMs: 30_000`, `animationSpeedMs: 60`
  - Settings persist across page refresh
  - `useConnect4Settings()` convenience hook exported from `src/lib/connect4/state/`
    **Dependencies:** T01
    **Files:**
  - `src/lib/connect4/state/useConnect4Settings.ts` _(new)_
    **Test targets:** Tier 1 — default values, persistence round-trip, partial override merges correctly
    **Estimated scope:** XS

---

- [x] **T13: SettingsPanel — Connect 4 section**
      **Description:** Add a "Connect 4" collapsible section to the existing `SettingsPanel` component with the 5 settings from the spec.
      **Acceptance criteria:**
  - Show Last Move toggle (default ON)
  - Allow Undo toggle (default ON)
  - Hints toggle (default ON)
  - Auto-hint delay dropdown: Off / 15s / 30s / 60s (default 30s)
  - Animation speed dropdown: Off / Slow / Normal / Fast (default Normal → 60ms/row)
  - All controls persist via `useConnect4Settings`
  - Section only renders when `gameType === "connect4"` context is active (prop-guard or conditional)
    **Dependencies:** T12
    **Files:**
  - `src/components/SettingsPanel/index.tsx`
  - `src/lib/connect4/state/useConnect4Settings.ts`
    **Test targets:** Tier 2 — smoke render; each toggle/dropdown renders without crash
    **Estimated scope:** S

---

### Group 6 — Hint System

---

- [x] **T14: hintConfig.ts + useHintSystem wiring**
      **Description:** Create `src/lib/connect4/hints/hintConfig.ts` with the spec's constants. Wire `useHintSystem` (reused from Chess) into the Connect4 store layer by creating a thin adapter hook `useConnect4HintSystem`.
      **Acceptance criteria:**
  - `hintConfig.ts` exports `HINT_TOKENS_PER_GAME = 3`, `AUTO_HINT_INACTIVITY_MS = 30_000`, `HINT_DISPLAY_MS = 3_000`
  - `useConnect4HintSystem` calls `useHintSystem` with `onRequestHint: store.requestHint`
  - Auto-hint fires only on the human player's turn (`isPlayerTurn` is false during AI thinking)
  - `secondsUntilAutoHint` is surfaced for the HUD countdown
    **Dependencies:** T11
    **Files:**
  - `src/lib/connect4/hints/hintConfig.ts` _(new)_
  - `src/lib/connect4/hints/useConnect4HintSystem.ts` _(new)_
    **Test targets:** Tier 1 — auto-hint not firing during AI turn, timer resets on user activity, tokens enforce via store
    **Estimated scope:** S

---

### Group 7 — Components

---

- [ ] **T15: Cell.tsx — single cell**
      **Description:** Implement `src/components/connect4/Connect4Board/Cell.tsx`. Renders one board cell: empty dark circle, Player 1 cyan disc, or Player 2 rose disc. Handles win-highlight (glow) and post-win desaturation states.
      **Acceptance criteria:**
  - Empty cell: dark circle using `--na-surface-2`, subtle inner shadow
  - Player 1 disc: fill `--na-cyan`, glow `--na-cyan`
  - Player 2 disc: fill `--na-rose`, glow `--na-rose`
  - `isWinning` prop: `filter: drop-shadow(0 0 14px var(--player-color))`, pulsing 2Hz via CSS animation
  - `isDesaturated` prop (non-winning post-win): 40% opacity, desaturate
  - `isLastPlaced` prop: thin outer ring fading over 1.5s
  - Cell size: `min(11vw, 72px)` square
  - Respects `prefers-reduced-motion` (no pulse, static bright opacity for wins)
    **Dependencies:** T01
    **Files:**
  - `src/components/connect4/Connect4Board/Cell.tsx` _(new)_
    **Test targets:** Tier 2 — renders empty, renders Player 1, renders Player 2, renders winning state without crash
    **Estimated scope:** S

---

- [ ] **T16: ColumnDropZone.tsx — hit area + hover arrow**
      **Description:** Implement `src/components/connect4/Connect4Board/ColumnDropZone.tsx`. Invisible hit area spanning full column height + 44px above top row. Shows a hover arrow above the column in the current player's color.
      **Acceptance criteria:**
  - Tap target width ≥ 44px (enforced via `min-w-[44px]`)
  - Arrow slides down 4px + fades in (120ms) on hover; disappears on mouse-leave
  - Arrow color matches current player (`--na-cyan` for P1, `--na-rose` for P2)
  - `isFull` prop: arrow grays out, click is no-op
  - `isHint` prop: arrow pulses cyan at 2Hz; column background tints cyan at 12%
  - `isHovered` prop: column background tints current player color at 8%
  - Disabled state (AI thinking / animation in progress / game not playing): no interaction, no visual change on hover
  - Reduced motion: no slide animation on arrow, instant show/hide
    **Dependencies:** T01
    **Files:**
  - `src/components/connect4/Connect4Board/ColumnDropZone.tsx` _(new)_
    **Test targets:** Tier 2 — renders, click handler called, click no-op when `isFull`, click no-op when `disabled`
    **Estimated scope:** S

---

- [ ] **T17: WinLine.tsx — winning cells highlight overlay**
      **Description:** Implement `src/components/connect4/Connect4Board/WinLine.tsx`. Receives `winResult` (4 `[col, row]` pairs) and applies glow pulse to those specific cells. This is an overlay component that communicates cell positions down to `Cell.tsx` via a shared `winningCells: Set<string>` derived value — not a drawn line.
      **Acceptance criteria:**
  - Given 4 `[col, row]` pairs, marks those cells as `isWinning`
  - Non-winning placed discs get `isDesaturated` flag
  - No SVG line — glow on cells only (per spec: "Animated win line is out of scope")
  - Mounts and unmounts cleanly; no layout shift
    **Dependencies:** T15
    **Files:**
  - `src/components/connect4/Connect4Board/WinLine.tsx` _(new)_
    **Test targets:** Tier 2 — renders with a win result, passes correct flags to child cells
    **Estimated scope:** XS

---

- [ ] **T18: Connect4Board/index.tsx — grid + interaction**
      **Description:** Implement `src/components/connect4/Connect4Board/index.tsx`. Renders the 7×6 grid using `Cell` + `ColumnDropZone`. Wires hover, click, and animation state from the store. Board frame uses `--na-surface-1` + neon border.
      **Acceptance criteria:**
  - 7 columns × 6 rows rendered; board is column-major (col 0 = left)
  - Board centered, `max-width: 560px`; cells `min(11vw, 72px)` square
  - On mobile `< 480px` column width `calc(100vw / 7)` clamped ≥ 44px
  - Column click dispatches `dropDisc(col)` via store
  - Column hover dispatches `hoverColumn(col)`; mouse-leave dispatches `hoverColumn(null)`
  - All interaction disabled during `isThinking`, `animatingDisc !== null`, or `status !== "playing"`
  - `WinLine` renders over the grid when `winResult` is present
  - Falling disc animation renders as absolutely positioned element translating from top to `toRow` (see T21)
    **Dependencies:** T15, T16, T17, T11
    **Files:**
  - `src/components/connect4/Connect4Board/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders 42 cells, click dispatches correct column, disabled state prevents dispatch
    **Estimated scope:** M

---

- [ ] **T19: Connect4HUD/index.tsx — turn indicator + tokens + undo**
      **Description:** Implement `src/components/connect4/Connect4HUD/index.tsx`. Shows active player chip, hint token icons, optional undo button, and "Thinking…" spinner state.
      **Acceptance criteria:**
  - Active-player chip pulses in player color (`--na-cyan` or `--na-rose`), shows nickname
  - 3 hint token icons; filled → empty as used; entire button disabled at 0 tokens
  - "Thinking…" spinner shown when `isThinking` (AI computing); overlaid on board, not the HUD
  - Undo button visible only when `settings.allowUndo && (mode === "solo" || mode === "local")`
  - Undo button disabled when `history.length === 0`
  - Online: HUD reorders so local user appears on left
    **Dependencies:** T11, T14
    **Files:**
  - `src/components/connect4/Connect4HUD/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders without crash, hint button disabled at 0 tokens, undo hidden in online mode
    **Estimated scope:** S

---

- [ ] **T20: Connect4ScoreBoard/index.tsx — session scores**
      **Description:** Implement `src/components/connect4/Connect4ScoreBoard/index.tsx`. Tracks and displays win/draw counts across games in the current session (local state, not persisted).
      **Acceptance criteria:**
  - Shows P1 wins, P2 wins, draws
  - Counts increment on game finish
  - Resets when component unmounts (session-scoped; not localStorage)
  - Player names/colors match game config
    **Dependencies:** T01
    **Files:**
  - `src/components/connect4/Connect4ScoreBoard/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders 0-0-0 on mount, increments on win prop change
    **Estimated scope:** XS

---

### Group 8 — Animations

---

- [ ] **T21: Disc fall animation**
      **Description:** Implement the gravity animation in `Connect4Board`. Disc appears at top of column (row 0 visually) and translates down to its final row. Duration = `animationSpeedMs × rowsTravelled`. Easing: `cubic-bezier(0.55, 0, 1, 0.45)`. Landing pulse: scale 1.0 → 1.12 → 1.0 (120ms, spring stiffness 300 damping 20).
      **Acceptance criteria:**
  - Disc animates from top to `toRow` on every `dropDisc` call
  - Duration scales with distance (1-row drop ≈ 60ms, 5-row drop ≈ 300ms at default speed)
  - Board input locked for animation duration (`animatingDisc !== null`)
  - Landing scale pulse plays after translation completes
  - `animationSpeedMs: 0` (Off setting) → instant placement, no animation
  - `prefers-reduced-motion` → instant placement, no animation, no pulse
    **Dependencies:** T18, T11
    **Files:**
  - `src/components/connect4/Connect4Board/index.tsx`
  - `src/components/connect4/Connect4Board/Cell.tsx`
    **Test targets:** Tier 2 — animation renders without crash; reduced-motion skips animation (mock `useReducedMotion`)
    **Estimated scope:** M

---

- [ ] **T22: Win highlight + desaturation animation**
      **Description:** On win: winning 4 cells glow-pulse at 2Hz indefinitely; all other discs desaturate to 40% opacity (200ms ease-out). Optional confetti via existing `tsparticles`, color-coded to winner.
      **Acceptance criteria:**
  - Winning cells: `drop-shadow` glow pulses 1.0 → 1.6 → 1.0 at 2Hz via CSS animation
  - Non-winning discs: opacity transitions to 0.4 over 200ms
  - `prefers-reduced-motion`: static bright opacity on winning cells, no pulse, no confetti
  - `WinOverlay` mounts via `GamePageShell` (reuse existing)
  - Confetti particles are color-coded to the winner (cyan for P1, rose for P2)
    **Dependencies:** T15, T17
    **Files:**
  - `src/components/connect4/Connect4Board/Cell.tsx`
  - `src/components/connect4/Connect4Board/WinLine.tsx`
    **Test targets:** Tier 2 — winning cell renders glow class; desaturated cell renders opacity class
    **Estimated scope:** S

---

- [ ] **T23: Column hover arrow + hint column animation**
      **Description:** Animate the column hover arrow (slide + fade). Animate the hint column highlight (arrow + background pulse at 2Hz). Use `AnimatePresence` for mount/unmount of both.
      **Acceptance criteria:**
  - Hover arrow: slides down 4px + fades in (120ms) on hover; reverses on leave
  - Hint arrow: pulses cyan at 2Hz; column background tints cyan at 12%
  - Hint highlight uses `AnimatePresence` for smooth fade in/out over `HINT_DISPLAY_MS`
  - Hint layer renders above hover layer (z-order per spec)
  - `prefers-reduced-motion`: instant show/hide, no pulse
    **Dependencies:** T16, T14
    **Files:**
  - `src/components/connect4/Connect4Board/ColumnDropZone.tsx`
    **Test targets:** Tier 2 — hint column renders pulse class; non-hint column does not
    **Estimated scope:** S

---

### Group 9 — Page

---

- [ ] **T24: Connect4GamePage — solo + local modes**
      **Description:** Replace the stub `GamePage.tsx` with a real implementation handling solo (vs AI) and local (pass-and-play) game modes. Wire: store, AI hook, HUD, board, scoreboard, settings, hints, win overlay.
      **Acceptance criteria:**
  - Solo mode: AI plays as Player 2 after each human move; difficulty from mode select
  - Local mode: alternating human turns; no AI
  - Game starts in `"playing"` state; `resetGame` restarts correctly
  - Undo works per mode (solo = undo pair, local = undo 1)
  - Win/draw shows `WinOverlay` (reused); overlay has "Play again" → `resetGame`
  - Settings panel accessible; changes take effect immediately
  - Hint system active in solo mode; disabled/hidden in local mode
  - `GamePageShell` wraps the page (particles, banner, route guards)
  - All acceptance criteria AC1–AC15, AC17–AC19 from spec are met
    **Dependencies:** T09, T11, T18, T19, T20, T13, T14
    **Files:**
  - `src/pages/Connect4/GamePage.tsx`
    **Test targets:** Tier 2 — page renders solo mode, page renders local mode, AI move fires after human move (mock AI hook)
    **Estimated scope:** L

---

### Group 10 — Online

---

- [ ] **T25: connect4GameMappers.ts — Firebase serialization**
      **Description:** Implement `src/lib/connect4/online/connect4GameMappers.ts`. Converts between `Connect4OnlineDoc` (Firebase RTDB schema) and `Connect4GameState`.
      **Acceptance criteria:**
  - `docToState(doc)` correctly maps `board` (2D array), `history`, `currentPlayer`, `winner`, `winCells` → `Connect4GameState`
  - `stateToDoc(state, move)` produces the exact patch fields: `{ board, history, currentPlayer, winner, winCells, lastMoveAt }`
  - Round-trip: `docToState(stateToDoc(state))` ≈ original state
  - Board serialization handles `null` cells correctly (not `undefined`)
    **Dependencies:** T01
    **Files:**
  - `src/lib/connect4/online/connect4GameMappers.ts` _(new)_
    **Test targets:** Tier 1 — round-trip fidelity, null cell handling, winner mapping (1 / 2 / "draw" / null)
    **Estimated scope:** S

---

- [ ] **T26: connect4GameService.ts — RTDB service**
      **Description:** Implement `src/lib/connect4/online/connect4GameService.ts`. Mirrors `chessGameService.ts` structure. Implements: `createConnect4Game`, `joinConnect4Game`, `commitMove`, `subscribeConnect4Game`, `resignGame`.
      **Acceptance criteria:**
  - `createConnect4Game` writes to `/games/connect4/{gameId}` with `status: "waiting"`
  - `commitMove` atomically patches the 7 fields listed in the spec schema
  - `subscribeConnect4Game` uses `onValue` and calls callback on every update
  - `resignGame` sets `status: "finished"` and `winner` to the non-resigning player
  - `gameType: "connect4"` on all documents (prevents cross-game queue matching)
    **Dependencies:** T25
    **Files:**
  - `src/lib/connect4/online/connect4GameService.ts` _(new)_
    **Test targets:** Tier 1 — `commitMove` patch shape is correct, `resignGame` sets correct winner, mappers called in correct order
    **Estimated scope:** M

---

- [ ] **T27: Connect4GamePage — online + friend modes**
      **Description:** Extend `GamePage.tsx` to handle online (matchmaking) and friend (direct invite) modes. Wire Firebase subscription, real-time sync, and resign flow.
      **Acceptance criteria:**
  - Online mode: subscribes to Firebase doc; only active player can write; moves sync within 300ms
  - `ConnectionLostBanner` shown on disconnect (reuse existing)
  - Resign button in online/friend modes; opponent sees result immediately
  - Player order: local user always shown on left of HUD
  - `gameType: "connect4"` queue entries do not cross-match (handled by service + queue filter)
  - AC16, AC20, AC21 from spec are met
    **Dependencies:** T24, T26
    **Files:**
  - `src/pages/Connect4/GamePage.tsx`
  - `src/lib/connect4/online/connect4GameService.ts`
    **Test targets:** Tier 2 — page renders in online mode stub, resign dispatches correct service call (mocked Firebase)
    **Estimated scope:** L

---

## Summary

| #   | Task                                 | Group      | Scope | Deps                        |
| --- | ------------------------------------ | ---------- | ----- | --------------------------- |
| T01 | Core types + GameType extension      | Types      | XS    | —                           |
| T02 | connect4Config + route registration  | Types      | S     | T01                         |
| T03 | rules.ts — board helpers             | Engine     | S     | T01                         |
| T04 | rules.ts — dropDisc + checkWin       | Engine     | M     | T03                         |
| T05 | rules.ts — checkDraw                 | Engine     | XS    | T04                         |
| T06 | aiEasy.ts — random strategy          | AI         | XS    | T03                         |
| T07 | aiMedium.ts — heuristic strategy     | AI         | S     | T04                         |
| T08 | aiHard.ts — minimax + alpha-beta     | AI         | L     | T04                         |
| T09 | ai.ts + difficultyMap + Web Worker   | AI         | M     | T06–T08, T11                |
| T10 | connect4Reducer.ts                   | State      | M     | T05                         |
| T11 | useConnect4Store.ts                  | State      | M     | T10, T08                    |
| T12 | Connect4Settings + useGameSettings   | Settings   | XS    | T01                         |
| T13 | SettingsPanel — Connect 4 section    | Settings   | S     | T12                         |
| T14 | hintConfig.ts + useHintSystem wiring | Hints      | S     | T11                         |
| T15 | Cell.tsx                             | Components | S     | T01                         |
| T16 | ColumnDropZone.tsx                   | Components | S     | T01                         |
| T17 | WinLine.tsx                          | Components | XS    | T15                         |
| T18 | Connect4Board/index.tsx              | Components | M     | T15–T17, T11                |
| T19 | Connect4HUD/index.tsx                | Components | S     | T11, T14                    |
| T20 | Connect4ScoreBoard/index.tsx         | Components | XS    | T01                         |
| T21 | Disc fall animation                  | Animations | M     | T18, T11                    |
| T22 | Win highlight + desaturation         | Animations | S     | T15, T17                    |
| T23 | Column hover + hint animation        | Animations | S     | T16, T14                    |
| T24 | GamePage — solo + local modes        | Page       | L     | T09, T11, T18–T20, T13, T14 |
| T25 | connect4GameMappers.ts               | Online     | S     | T01                         |
| T26 | connect4GameService.ts               | Online     | M     | T25                         |
| T27 | GamePage — online + friend modes     | Page       | L     | T24, T26                    |

**Total tasks: 27** | XS: 6 | S: 10 | M: 7 | L: 4

---

## Completion Checklist

- [x] T01 — [x] Impl — [x] Test
- [x] T02 — [x] Impl — [x] Test
- [x] T03 — [x] Impl — [x] Test
- [x] T04 — [x] Impl — [x] Test
- [x] T05 — [x] Impl — [x] Test
- [x] T06 — [x] Impl — [x] Test
- [x] T07 — [x] Impl — [x] Test
- [x] T08 — [x] Impl — [x] Test
- [x] T09 — [x] Impl — [x] Test
- [x] T10 — [x] Impl — [x] Test
- [x] T11 — [x] Impl — [x] Test
- [x] T12 — [x] Impl — [x] Test
- [x] T13 — [x] Impl — [x] Test
- [x] T14 — [x] Impl — [x] Test
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
