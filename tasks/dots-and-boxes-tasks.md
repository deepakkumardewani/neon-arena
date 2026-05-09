# Implementation Plan: Dots & Boxes

## Overview

Add Dots & Boxes as a first-class game in NeonArena. Same neon-cyberpunk aesthetic, same 4-mode structure (solo, local, online, friend), same routing shell, same Firebase backend. Tasks are ordered so each builds on the previous: types → engine → AI → state → components → page → online → settings → animations.

## Architecture Decisions

- **Edge-indexed board storage**: `horizontalEdges[N+1][M]` and `verticalEdges[N][M+1]` — clean separation of H and V edges matches spec types exactly.
- **Pure rules engine first**: all game logic lives in `src/lib/dotsAndBoxes/engine/rules.ts` with zero React/Zustand deps; Zustand calls it.
- **Bonus-turn rule in rules layer**: `claimEdge` enforces the no-switch rule when boxes are claimed; store is a thin wrapper.
- **Hard AI on a Web Worker**: minimax + chain analysis runs off the UI thread via Vite's native worker import (`new Worker(new URL(...))`).
- **Reuse all Chess/Connect4 shared abstractions**: `GamePageShell`, `GameConfig`, `useGameSettings`, `useHintSystem`, `WinOverlay`, queue service.
- **No new shared abstractions**: every new symbol lives under `src/lib/dotsAndBoxes/` or `src/components/dotsAndBoxes/`.
- **Framer Motion for animations**: edge draw, box fill, bonus-turn indicator — all respect `useReducedMotion`.

---

## Task List

### Group 1 — Types & Config

---

- [ ] **T01: Core types + GameType extension**
      **Description:** Create `src/lib/dotsAndBoxes/types.ts` with all Dots & Boxes–specific types exactly as specified. Extend the `GameType` union in `src/types/game.ts` to include `"dots-and-boxes"`.
      **Acceptance criteria:**
  - `src/lib/dotsAndBoxes/types.ts` exports: `PlayerId`, `EdgeOrientation`, `EdgeRef`, `DotsMove`, `BoxRef`, `DotsStatus`, `BoardSize`, `DotsGameState`, `DotsSettings`
  - `GameType` in `src/types/game.ts` includes `"dots-and-boxes"`
  - All types are `readonly`-safe; no `any`
  - Project builds clean (`vp build`)
    **Dependencies:** None
    **Files:**
  - `src/lib/dotsAndBoxes/types.ts` _(new)_
  - `src/types/game.ts`
    **Test targets:** Tier 2 — type-level tests via `tsc --noEmit`; no runtime tests needed for type declarations
    **Estimated scope:** XS

---

- [ ] **T02: dotsConfig + route registration**
      **Description:** Create `src/pages/DotsAndBoxes/dotsConfig.ts` (mirrors `chessConfig.ts`). Register the `/play/dots-and-boxes` route family in the router — `ModeSelectPage`, `NicknameEntryPage`, `MatchmakingPage` routes are shared; `DotsAndBoxesGamePage` route is a stub that renders `<div>Dots & Boxes</div>` for now. Add a Dots & Boxes `GameCard` on the homepage.
      **Acceptance criteria:**
  - `dotsConfig` has `gameType: "dots-and-boxes"`, all 4 modes, correct `routePrefix`
  - `/play/dots-and-boxes` renders `ModeSelectPage` with Dots & Boxes title
  - `/play/dots-and-boxes/game` renders the stub page without crashing
  - `/game/dots-and-boxes/:gameId` route exists (stub)
  - Homepage GameCard for Dots & Boxes navigates to `/play/dots-and-boxes`
  - `vp build` passes
    **Dependencies:** T01
    **Files:**
  - `src/pages/DotsAndBoxes/dotsConfig.ts` _(new)_
  - `src/pages/DotsAndBoxes/GamePage.tsx` _(new — stub)_
  - `src/App.tsx` or router file _(add routes)_
  - `src/pages/Home/index.tsx` _(add GameCard)_
    **Test targets:** Tier 2 — smoke render test for the stub `GamePage`
    **Estimated scope:** S

---

### Group 2 — Rules Engine

---

- [ ] **T03: rules.ts — edge and board helpers**
      **Description:** Implement the pure board helper functions in `src/lib/dotsAndBoxes/engine/rules.ts`: `createInitialState`, `isEdgeDrawn`, `listLegalEdges`.
      **Acceptance criteria:**
  - `createInitialState(size)` returns a valid `DotsGameState` with all edges `false`, all `boxOwner` `null`, `currentPlayer: 1`, `status: "idle"`, `scores: { 1: 0, 2: 0 }`, `hintTokens: 3`, `history: []`, `hoveredEdge: null`, `hintEdge: null`, `lastClaimedBoxes: []`
  - `isEdgeDrawn(state, edge)` correctly reads `horizontalEdges` or `verticalEdges` based on `edge.orientation`
  - `listLegalEdges(state)` returns all undrawn edges as `EdgeRef[]`; empty array when all edges drawn
  - Board is treated as immutable throughout; no mutations
  - Handles 3×3, 4×4, and 5×5 `BoardSize` correctly
    **Dependencies:** T01
    **Files:**
  - `src/lib/dotsAndBoxes/engine/rules.ts` _(new)_
    **Test targets:** Tier 1 — full branch coverage: fresh state, partially drawn board, fully drawn board, H edge vs V edge lookup
    **Estimated scope:** S

---

- [ ] **T04: rules.ts — claimEdge + box completion**
      **Description:** Implement `claimEdge`, `isBoxComplete`, and the bonus-turn rule in `rules.ts`.
      **Acceptance criteria:**
  - `isBoxComplete(state, box)` returns `true` iff all 4 edges surrounding `box` are drawn
  - `claimEdge(state, edge)` marks the edge as drawn, scans adjacent boxes, awards ownership, updates `scores`, appends to `history`, sets `lastClaimedBoxes`
  - Bonus-turn rule: if ≥ 1 box is claimed, `currentPlayer` does NOT switch
  - Two-box completion in one move (corner/center edges) scores 2 and grants bonus turn
  - Claiming an already-drawn edge is a no-op (returns state unchanged)
  - `status` transitions to `"playing"` on first claim if `"idle"`
    **Dependencies:** T03
    **Files:**
  - `src/lib/dotsAndBoxes/engine/rules.ts`
    **Test targets:** Tier 1 — single box completion, double box completion, no completion (turn switches), already-drawn edge no-op, score accumulation
    **Estimated scope:** M

---

- [ ] **T05: rules.ts — game over**
      **Description:** Implement `isGameOver` and `computeWinner` in `rules.ts`. Wire both into `claimEdge` so `status` and `winner` are set when the board is full.
      **Acceptance criteria:**
  - `isGameOver(state)` returns `true` iff all edges are drawn (no legal edges remain)
  - `computeWinner(state)` returns `PlayerId | "draw" | null`; draw when `scores[1] === scores[2]`
  - `claimEdge` sets `status: "finished"` and `winner` when `isGameOver` is `true` after the claim
    **Dependencies:** T04
    **Files:**
  - `src/lib/dotsAndBoxes/engine/rules.ts`
    **Test targets:** Tier 1 — full board P1 wins, full board P2 wins, full board draw, partial board returns null
    **Estimated scope:** XS

---

### Group 3 — AI

---

- [ ] **T06: aiEasy.ts — random strategy**
      **Description:** Implement `src/lib/dotsAndBoxes/engine/aiEasy.ts`. Exports `chooseEdge(state: DotsGameState): EdgeRef` — picks a uniformly random edge from `listLegalEdges`.
      **Acceptance criteria:**
  - Never returns an already-drawn edge
  - Returns a valid `EdgeRef` on any non-finished board
  - On a fresh 5×5 board, distribution is roughly uniform (statistical, not deterministic)
    **Dependencies:** T03
    **Files:**
  - `src/lib/dotsAndBoxes/engine/aiEasy.ts` _(new)_
    **Test targets:** Tier 1 — returns legal edge, never picks drawn edge, handles single-legal-edge board
    **Estimated scope:** XS

---

- [ ] **T07: aiMedium.ts — greedy strategy**
      **Description:** Implement `src/lib/dotsAndBoxes/engine/aiMedium.ts`. Priority: (1) claim any edge that completes a box (prefer 2-box if available), (2) play any "safe" edge (does not give a 3rd side to a box), (3) if only loony moves remain, sacrifice the shortest chain.
      **Acceptance criteria:**
  - If an edge completes 2 boxes, plays it (greedy best)
  - If an edge completes 1 box, plays it (grabs the point)
  - Otherwise picks a safe edge (adding it gives opponent no immediate box)
  - If no safe edges exist, picks the move that gives opponent the fewest boxes
  - Returns a legal `EdgeRef` in all cases
    **Dependencies:** T04
    **Files:**
  - `src/lib/dotsAndBoxes/engine/aiMedium.ts` _(new)_
    **Test targets:** Tier 1 — box-completion detection, safe-edge avoidance, loony-move fallback, 2-box preference over 1-box
    **Estimated scope:** S

---

- [ ] **T08: chainAnalysis.ts — chain detection helpers**
      **Description:** Implement `src/lib/dotsAndBoxes/engine/chainAnalysis.ts`. Exports utilities used by `aiHard` and `aiMedium`: `detectChains`, `chainLength`, `isLoonySacrifice`, `doubleCrossEdge`.
      **Acceptance criteria:**
  - `detectChains(state)` returns an array of chains (each chain is an array of `BoxRef` in the chain)
  - `chainLength(chain)` returns number of boxes in the chain
  - `isLoonySacrifice(state, edge)` returns `true` if claiming `edge` gives the opponent a box on their next move
  - `doubleCrossEdge(state, chain)` returns the edge that sacrifices the minimum (double-cross tactic) — the edge before the last 2 boxes in the chain
  - All functions are pure; no mutations
    **Dependencies:** T04
    **Files:**
  - `src/lib/dotsAndBoxes/engine/chainAnalysis.ts` _(new)_
    **Test targets:** Tier 1 — chain detection on 3-box chain, double-cross edge is correct position, loony detection, isolated box not in chain
    **Estimated scope:** M

---

- [ ] **T09: aiHard.ts — minimax + alpha-beta**
      **Description:** Implement `src/lib/dotsAndBoxes/engine/aiHard.ts`. Minimax with alpha-beta pruning, `maxDepth: 8`. Evaluation: `myScore - oppScore + chainParityBonus`. Move ordering: completing moves first, then safe moves, then sacrifices. Uses `chainAnalysis.ts` for double-cross decisions. Hint extraction uses depth 6.
      **Acceptance criteria:**
  - Returns a legal `EdgeRef` on any non-terminal board
  - Uses double-cross strategy when `chainLength ≥ 3` (verifiable in endgame test)
  - Completes within 2s on a cold-start 5×5 board at depth 8 (timing test)
  - `chooseEdge` accepts optional `{ maxDepth?: number }` override for hint extraction
    **Dependencies:** T08
    **Files:**
  - `src/lib/dotsAndBoxes/engine/aiHard.ts` _(new)_
    **Test targets:** Tier 1 — returns legal move, wins when one-move-win available, applies double-cross in endgame fixture, timing assertion < 2000ms at depth 8 on 5×5
    **Estimated scope:** L

---

- [ ] **T10: ai.ts + difficultyMap.ts + Web Worker + useDotsAI**
      **Description:** Create `src/lib/dotsAndBoxes/engine/ai.ts` (difficulty router), `difficultyMap.ts` (config constants), and `src/lib/dotsAndBoxes/engine/ai.worker.ts` (Web Worker wrapper for Hard AI). Create `useDotsAI` hook in `src/lib/dotsAndBoxes/engine/useDotsAI.ts`.
      **Acceptance criteria:**
  - `difficultyMap.ts` exports `DIFFICULTY_CONFIG` with easy/medium/hard entries matching spec (`thinkMs`, `strategy`, `maxDepth`)
  - `ai.ts` routes to correct strategy based on `Difficulty`
  - Hard AI calls are dispatched to the worker; Easy/Medium run inline
  - `useDotsAI(state, difficulty)` returns `{ isThinking }`, triggers `store.claimEdge` after `thinkMs` delay on AI's turn
  - Worker created via `new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' })`
    **Dependencies:** T06, T07, T09, T12
    **Files:**
  - `src/lib/dotsAndBoxes/engine/difficultyMap.ts` _(new)_
  - `src/lib/dotsAndBoxes/engine/ai.ts` _(new)_
  - `src/lib/dotsAndBoxes/engine/ai.worker.ts` _(new)_
  - `src/lib/dotsAndBoxes/engine/useDotsAI.ts` _(new)_
    **Test targets:** Tier 1 — router calls correct strategy; `useDotsAI` triggers move after delay (mock timers); worker message round-trip
    **Estimated scope:** M

---

### Group 4 — State

---

- [ ] **T11: dotsReducer.ts — pure state transitions**
      **Description:** Implement `src/lib/dotsAndBoxes/state/dotsReducer.ts`. Pure `(state, action) => state` — no side effects. Actions: `CLAIM_EDGE`, `UNDO_MOVE`, `RESET_GAME`, `HOVER_EDGE`, `SET_HINT`, `CLEAR_HINT`.
      **Acceptance criteria:**
  - `CLAIM_EDGE` delegates to `rules.claimEdge`; no-ops on `status === "finished"` or already-drawn edge
  - `UNDO_MOVE` reverts last move from `history`; in solo mode, reverts through AI's bonus-turn chain back to the human's turn; no-ops if `history` empty
  - `RESET_GAME` returns `createInitialState(size)` preserving `hintTokens: 3`
  - `HOVER_EDGE` / `SET_HINT` / `CLEAR_HINT` are simple field updates
  - All actions return new state object; input state is never mutated
    **Dependencies:** T05
    **Files:**
  - `src/lib/dotsAndBoxes/state/dotsReducer.ts` _(new)_
    **Test targets:** Tier 1 — each action type, undo at empty history, undo through AI bonus chain in solo mode, reset preserves token count
    **Estimated scope:** M

---

- [ ] **T12: useDotsStore.ts — Zustand store**
      **Description:** Implement `src/lib/dotsAndBoxes/state/useDotsStore.ts`. Wraps the reducer; exposes `hoverEdge`, `claimEdge`, `undoMove`, `requestHint`, `clearHint`, `resetGame`. `requestHint` deducts a token, runs `aiHard.chooseEdge` at depth 6, sets `hintEdge`, schedules `clearHint` after `HINT_DISPLAY_MS`.
      **Acceptance criteria:**
  - Store state reflects all reducer transitions
  - `requestHint` no-ops when `hintTokens === 0`
  - `requestHint` calls `aiHard.chooseEdge` with `{ maxDepth: 6 }` and stores result in `hintEdge`
  - `clearHint` nulls `hintEdge`
  - `claimEdge` dispatches `lastClaimedBoxes` animation state; clears after 600ms
    **Dependencies:** T11, T09
    **Files:**
  - `src/lib/dotsAndBoxes/state/useDotsStore.ts` _(new)_
    **Test targets:** Tier 1 — hint token decrement, hint no-op at 0 tokens, lastClaimedBoxes clears after timeout, claimEdge no-op on finished game
    **Estimated scope:** M

---

### Group 5 — Settings

---

- [ ] **T13: DotsSettings + useGameSettings wiring**
      **Description:** Create `DotsSettings` default values and wire `useGameSettings<DotsSettings>` (reuse existing hook) with `localStorage` key `neon-arena:dots-and-boxes-settings`.
      **Acceptance criteria:**
  - Default settings: `defaultSize: { rows: 5, cols: 5 }`, `showLastMove: true`, `allowUndo: true`, `hintsEnabled: true`, `autoHintDelayMs: 30_000`
  - Settings persist across page refresh
  - `useDotsSettings()` convenience hook exported from `src/lib/dotsAndBoxes/state/`
    **Dependencies:** T01
    **Files:**
  - `src/lib/dotsAndBoxes/state/useDotsSettings.ts` _(new)_
    **Test targets:** Tier 1 — default values, persistence round-trip, partial override merges correctly
    **Estimated scope:** XS

---

- [ ] **T14: SettingsPanel — Dots & Boxes section**
      **Description:** Add a "Dots & Boxes" collapsible section to the existing `SettingsPanel` component with the 5 settings from the spec.
      **Acceptance criteria:**
  - Default Size picker: 3×3 / 4×4 / 5×5 (solo + local only)
  - Show Last Move toggle (default ON)
  - Allow Undo toggle (default ON)
  - Hints toggle (default ON)
  - Auto-hint delay dropdown: Off / 15s / 30s / 60s (default 30s)
  - All controls persist via `useDotsSettings`
  - Section only renders when `gameType === "dots-and-boxes"` context is active
    **Dependencies:** T13
    **Files:**
  - `src/components/SettingsPanel/index.tsx`
  - `src/lib/dotsAndBoxes/state/useDotsSettings.ts`
    **Test targets:** Tier 2 — smoke render; each toggle/dropdown renders without crash
    **Estimated scope:** S

---

### Group 6 — Hint System

---

- [ ] **T15: hintConfig.ts + useHintSystem wiring**
      **Description:** Create `src/lib/dotsAndBoxes/hints/hintConfig.ts` with the spec's constants. Wire `useHintSystem` (reused from Chess) into the Dots store layer by creating a thin adapter hook `useDotsHintSystem`.
      **Acceptance criteria:**
  - `hintConfig.ts` exports `HINT_TOKENS_PER_GAME = 3`, `AUTO_HINT_INACTIVITY_MS = 30_000`, `HINT_DISPLAY_MS = 3_000`
  - `useDotsHintSystem` calls `useHintSystem` with `onRequestHint: store.requestHint`
  - Auto-hint fires only on the human player's turn (`isPlayerTurn` is `false` during AI thinking)
  - `secondsUntilAutoHint` is surfaced for the HUD countdown
    **Dependencies:** T12
    **Files:**
  - `src/lib/dotsAndBoxes/hints/hintConfig.ts` _(new)_
  - `src/lib/dotsAndBoxes/hints/useDotsHintSystem.ts` _(new)_
    **Test targets:** Tier 1 — auto-hint not firing during AI turn, timer resets on user activity, tokens enforced via store
    **Estimated scope:** S

---

### Group 7 — Components

---

- [ ] **T16: Dot.tsx — single dot node**
      **Description:** Implement `src/components/dotsAndBoxes/DotsBoard/Dot.tsx`. Renders one dot node at a grid intersection.
      **Acceptance criteria:**
  - Filled circle using `--na-fg` color
  - 6px diameter on desktop, 8px on mobile (`@media (max-width: 480px)`)
  - Always rendered on top (z-index highest layer)
  - No interactivity; purely presentational
    **Dependencies:** T01
    **Files:**
  - `src/components/dotsAndBoxes/DotsBoard/Dot.tsx` _(new)_
    **Test targets:** Tier 2 — renders without crash; snapshot of a single dot
    **Estimated scope:** XS

---

- [ ] **T17: Edge.tsx — horizontal/vertical edge**
      **Description:** Implement `src/components/dotsAndBoxes/DotsBoard/Edge.tsx`. Handles both orientations. Renders undrawn guide, hover preview, drawn edge, last-move highlight, and hint highlight states.
      **Acceptance criteria:**
  - Undrawn: 2px line, `--na-surface-2` at 30% opacity
  - Hovered (current player, desktop): 3px line, player color at 60% with glow
  - Drawn: 3px solid, color of the player who drew it (`--na-cyan` P1, `--na-rose` P2)
  - Last-move: outer glow pulse for 600ms
  - Hint: pulsing cyan glow at 2Hz, 1.0 → 1.15 → 1.0 scale via CSS animation
  - Hit area ≥ 24px via transparent padding (both orientations)
  - `isDisabled` prop: no hover effect, no click handler
  - Respects `prefers-reduced-motion` (instant state change, no pulse)
    **Dependencies:** T01
    **Files:**
  - `src/components/dotsAndBoxes/DotsBoard/Edge.tsx` _(new)_
    **Test targets:** Tier 2 — renders undrawn, renders drawn P1, renders drawn P2, renders hint state, disabled suppresses click
    **Estimated scope:** S

---

- [ ] **T18: Box.tsx — filled box**
      **Description:** Implement `src/components/dotsAndBoxes/DotsBoard/Box.tsx`. Renders a claimed box with semi-transparent owner color fill and owner initial centered.
      **Acceptance criteria:**
  - Unclaimed: transparent background (not rendered or zero opacity)
  - Claimed P1: semi-transparent `--na-cyan` fill + "A" initial (or configurable) centered in box
  - Claimed P2: semi-transparent `--na-rose` fill + "B" initial centered
  - `isLastClaimed` prop: outer glow pulse for 600ms via CSS keyframe
  - `prefers-reduced-motion`: opacity snap, no scale animation
    **Dependencies:** T01
    **Files:**
  - `src/components/dotsAndBoxes/DotsBoard/Box.tsx` _(new)_
    **Test targets:** Tier 2 — renders unclaimed (transparent), renders claimed P1, renders claimed P2, last-claimed applies glow class
    **Estimated scope:** S

---

- [ ] **T19: DotsBoard/index.tsx — grid layout + interaction**
      **Description:** Implement `src/components/dotsAndBoxes/DotsBoard/index.tsx`. Renders dots, edges, and boxes in a layered grid. Wires hover and click to store actions. Scales for 3×3 / 4×4 / 5×5.
      **Acceptance criteria:**
  - Board uses CSS `aspect-ratio: cols / rows` inside `min(90vw, 600px)` container
  - Render layers (bottom to top): box fills → box-claim pulse → undrawn guides → hover preview → drawn edges → last-move glow → hint glow → dots
  - Edge click dispatches `store.claimEdge(edge)`
  - Edge hover dispatches `store.hoverEdge(edge)`; mouse-leave dispatches `store.hoverEdge(null)`
  - All interaction disabled during AI thinking, `status !== "playing"`, or online opponent's turn
  - Dots (N+1 × M+1 grid) always rendered on top layer
  - Horizontal edges: N+1 rows × M per row; Vertical edges: N rows × M+1 per row
  - Correct rendering on 375px viewport (≥ 24px tap targets)
    **Dependencies:** T16, T17, T18, T12
    **Files:**
  - `src/components/dotsAndBoxes/DotsBoard/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders correct edge count for 3×3, 4×4, 5×5; click dispatches claimEdge; disabled state prevents dispatch
    **Estimated scope:** M

---

- [ ] **T20: ScoreBoard/index.tsx — score badges + turn indicator**
      **Description:** Implement `src/components/dotsAndBoxes/ScoreBoard/index.tsx`. Two player score badges, active-player pulse, and bonus-turn "+1 turn" indicator.
      **Acceptance criteria:**
  - Two badges: P1 (cyan) and P2 (rose) with score numbers
  - Active-player badge pulses with their color
  - Score number plays a subtle count-up animation on change (Framer Motion)
  - "+1 turn" tag fades in next to active badge when `lastClaimedBoxes` is non-empty, holds 1.2s, fades out
  - Online: reorders so local user appears on left
  - `prefers-reduced-motion`: instant score update, no count-up, no tag animation
    **Dependencies:** T01
    **Files:**
  - `src/components/dotsAndBoxes/ScoreBoard/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders P1 and P2 badges, score displays correctly, bonus-turn tag renders when lastClaimedBoxes non-empty
    **Estimated scope:** S

---

- [ ] **T21: BoardSizePicker/index.tsx — pre-game size selector**
      **Description:** Implement `src/components/dotsAndBoxes/BoardSizePicker/index.tsx`. Radio button group for 3×3 / 4×4 / 5×5. Shown before the first move in solo and local modes only.
      **Acceptance criteria:**
  - Three options: 3×3, 4×4, 5×5; default from `DotsSettings.defaultSize`
  - Selection updates `DotsSettings.defaultSize` via `useDotsSettings`
  - Neon panel style matching existing game-mode selectors
  - Not rendered in online or friend modes (always 5×5)
  - Not rendered after the first edge has been claimed
    **Dependencies:** T13
    **Files:**
  - `src/components/dotsAndBoxes/BoardSizePicker/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders three options, selecting an option updates settings, hidden in online mode
    **Estimated scope:** XS

---

- [ ] **T22: DotsHUD/index.tsx — hint tokens + active-player chip**
      **Description:** Implement `src/components/dotsAndBoxes/DotsHUD/index.tsx`. Shows active-player chip, hint token counter, undo button, and AI thinking spinner.
      **Acceptance criteria:**
  - Active-player chip pulses in player color, shows nickname
  - 3 hint token icons; filled → empty as used; button disabled at 0 tokens
  - "Thinking…" spinner shown when `isThinking` (AI computing)
  - Undo button visible only when `settings.allowUndo && (mode === "solo" || mode === "local")`
  - Undo button disabled when `history.length === 0`
  - Online: local user chip always on left
    **Dependencies:** T12, T15
    **Files:**
  - `src/components/dotsAndBoxes/DotsHUD/index.tsx` _(new)_
    **Test targets:** Tier 2 — renders without crash, hint button disabled at 0 tokens, undo hidden in online mode
    **Estimated scope:** S

---

### Group 8 — Animations

---

- [ ] **T23: Edge claim animation**
      **Description:** Animate drawn edges using Framer Motion. Edge animates from one dot to the other (line draw, 180ms, ease-out). Color is the claiming player's color.
      **Acceptance criteria:**
  - Drawn edge animates `pathLength` 0 → 1 over 180ms with ease-out (SVG stroke or equivalent CSS)
  - Stroke color transitions to claiming player's color
  - `prefers-reduced-motion`: instant stroke, no animation
  - `animationSpeedMs: 0` (if wired from settings): same as reduced-motion behavior
    **Dependencies:** T17, T19
    **Files:**
  - `src/components/dotsAndBoxes/DotsBoard/Edge.tsx`
    **Test targets:** Tier 2 — animation renders without crash; reduced-motion mock skips animation
    **Estimated scope:** S

---

- [ ] **T24: Box claim animation + bonus-turn indicator**
      **Description:** Animate box fills (scale + opacity) and the "+1 turn" ScoreBoard tag.
      **Acceptance criteria:**
  - Box fill: scales 0.6 → 1.0, opacity 0 → 1 (220ms, spring stiffness 280 damping 24) via Framer Motion
  - Owner initial fades in 80ms after fill begins (Framer Motion `delay`)
  - Outer glow pulse on box for 600ms via CSS keyframe
  - "+1 turn" tag: slides in 180ms, holds 800ms, fades out 200ms (AnimatePresence)
  - `prefers-reduced-motion`: opacity snap, no scale, no tag slide
    **Dependencies:** T18, T20
    **Files:**
  - `src/components/dotsAndBoxes/DotsBoard/Box.tsx`
  - `src/components/dotsAndBoxes/ScoreBoard/index.tsx`
    **Test targets:** Tier 2 — box claim renders fill class; reduced-motion mock renders snap class; bonus-turn tag mounts/unmounts cleanly
    **Estimated scope:** S

---

- [ ] **T25: Hint highlight + game-over animations**
      **Description:** Animate hint edge highlight and the game-over sequence (unclaimed box fade + `WinOverlay` mount + optional confetti).
      **Acceptance criteria:**
  - Hint edge: pulsing cyan glow at 2Hz, scale 1.0 → 1.15 → 1.0; fade in 200ms, hold `HINT_DISPLAY_MS`, fade out 200ms via `AnimatePresence`
  - Game over: all unclaimed boxes fade to 20% opacity (200ms ease-out)
  - `WinOverlay` mounts via `GamePageShell` (reuse existing) with winner info + final scores
  - Optional confetti via existing `tsparticles`, color-coded to winner (cyan P1, rose P2)
  - `prefers-reduced-motion`: no confetti, no pulse, instant hint show/hide
    **Dependencies:** T17, T19, T12
    **Files:**
  - `src/components/dotsAndBoxes/DotsBoard/Edge.tsx`
  - `src/components/dotsAndBoxes/DotsBoard/Box.tsx`
    **Test targets:** Tier 2 — hint class applied to hintEdge; game-over opacity class applied to unclaimed boxes; WinOverlay renders on win
    **Estimated scope:** S

---

### Group 9 — Page

---

- [ ] **T26: DotsAndBoxesGamePage — solo + local modes**
      **Description:** Replace the stub `GamePage.tsx` with a real implementation handling solo (vs AI) and local (pass-and-play) game modes. Wire: store, AI hook, HUD, board, scoreboard, size picker, settings, hints, win overlay.
      **Acceptance criteria:**
  - Solo mode: AI plays as Player 2 after each human move (or after bonus chain); difficulty from mode select
  - Local mode: alternating human turns (bonus-turn rule applies); no AI
  - `BoardSizePicker` shown pre-game in solo + local; hidden in online/friend
  - Game starts in `"playing"` state after first edge; `resetGame` restarts with same size
  - Undo works per mode (solo = undo through AI bonus chain back to human; local = undo 1 move)
  - Win/draw shows `WinOverlay`; "Play again" → `resetGame`
  - Settings panel accessible; changes apply immediately
  - Hint system active in solo mode; hidden in local mode
  - `GamePageShell` wraps the page (particles, banner, route guards)
  - AC1–AC15, AC17 from spec are met
    **Dependencies:** T10, T12, T19, T22, T20, T14, T15, T21
    **Files:**
  - `src/pages/DotsAndBoxes/GamePage.tsx`
    **Test targets:** Tier 2 — page renders solo mode, page renders local mode, AI move fires after human move (mock AI hook)
    **Estimated scope:** L

---

### Group 10 — Online

---

- [ ] **T27: dotsGameMappers.ts — Firebase serialization**
      **Description:** Implement `src/lib/dotsAndBoxes/online/dotsGameMappers.ts`. Converts between `DotsOnlineDoc` (Firebase RTDB schema) and `DotsGameState`.
      **Acceptance criteria:**
  - `docToState(doc)` correctly maps `horizontalEdges` (2D bool array), `verticalEdges`, `boxOwner`, `history`, `currentPlayer`, `scores`, `winner` → `DotsGameState`
  - `stateToDoc(state, move)` produces the exact patch fields: `{ horizontalEdges, verticalEdges, boxOwner, currentPlayer, scores, history, lastMoveAt }`
  - Round-trip: `docToState(stateToDoc(state))` ≈ original state (all gameplay fields)
  - 2D boolean arrays serialized without `undefined` (use `false` for undrawn)
  - `boxOwner` null cells correctly preserved
    **Dependencies:** T01
    **Files:**
  - `src/lib/dotsAndBoxes/online/dotsGameMappers.ts` _(new)_
    **Test targets:** Tier 1 — round-trip fidelity on 5×5 state, null boxOwner preserved, winner mapping (1 / 2 / "draw" / null)
    **Estimated scope:** S

---

- [ ] **T28: dotsGameService.ts — RTDB service**
      **Description:** Implement `src/lib/dotsAndBoxes/online/dotsGameService.ts`. Mirrors `chessGameService.ts` structure. Implements: `createDotsGame`, `joinDotsGame`, `commitMove`, `subscribeDotsGame`, `resignGame`.
      **Acceptance criteria:**
  - `createDotsGame` writes to `/games/dots-and-boxes/{gameId}` with `status: "waiting"`, `gameType: "dots-and-boxes"`, and initial 5×5 state
  - `commitMove` atomically patches the 7 fields from spec schema
  - `subscribeDotsGame` uses `onValue` and calls callback on every update
  - `resignGame` sets `status: "finished"` and `winner` to the non-resigning player
  - `gameType: "dots-and-boxes"` on all documents (prevents cross-game queue matching)
    **Dependencies:** T27
    **Files:**
  - `src/lib/dotsAndBoxes/online/dotsGameService.ts` _(new)_
    **Test targets:** Tier 1 — `commitMove` patch shape is correct, `resignGame` sets correct winner, mappers called in correct order
    **Estimated scope:** M

---

- [ ] **T29: DotsAndBoxesGamePage — online + friend modes**
      **Description:** Extend `GamePage.tsx` to handle online (matchmaking) and friend (direct invite) modes. Wire Firebase subscription, real-time sync, and resign flow.
      **Acceptance criteria:**
  - Online mode: subscribes to Firebase doc; only active player can write; moves sync within 300ms
  - `ConnectionLostBanner` shown on disconnect (reuse existing)
  - Resign button in online/friend modes; opponent sees result immediately
  - Local user always shown on left of ScoreBoard and HUD
  - `gameType: "dots-and-boxes"` queue entries do not cross-match (handled by service + queue filter)
  - AC13, AC17, AC18 from spec are met
    **Dependencies:** T26, T28
    **Files:**
  - `src/pages/DotsAndBoxes/GamePage.tsx`
  - `src/lib/dotsAndBoxes/online/dotsGameService.ts`
    **Test targets:** Tier 2 — page renders in online mode stub, resign dispatches correct service call (mocked Firebase)
    **Estimated scope:** L

---

## Summary

| #   | Task                                           | Group      | Scope | Deps                                   |
| --- | ---------------------------------------------- | ---------- | ----- | -------------------------------------- |
| T01 | Core types + GameType extension                | Types      | XS    | —                                      |
| T02 | dotsConfig + route registration                | Types      | S     | T01                                    |
| T03 | rules.ts — edge and board helpers              | Engine     | S     | T01                                    |
| T04 | rules.ts — claimEdge + box completion          | Engine     | M     | T03                                    |
| T05 | rules.ts — game over                           | Engine     | XS    | T04                                    |
| T06 | aiEasy.ts — random strategy                    | AI         | XS    | T03                                    |
| T07 | aiMedium.ts — greedy strategy                  | AI         | S     | T04                                    |
| T08 | chainAnalysis.ts — chain detection helpers     | AI         | M     | T04                                    |
| T09 | aiHard.ts — minimax + alpha-beta               | AI         | L     | T08                                    |
| T10 | ai.ts + difficultyMap + Web Worker + useDotsAI | AI         | M     | T06, T07, T09, T12                     |
| T11 | dotsReducer.ts                                 | State      | M     | T05                                    |
| T12 | useDotsStore.ts                                | State      | M     | T11, T09                               |
| T13 | DotsSettings + useGameSettings                 | Settings   | XS    | T01                                    |
| T14 | SettingsPanel — Dots & Boxes section           | Settings   | S     | T13                                    |
| T15 | hintConfig.ts + useHintSystem wiring           | Hints      | S     | T12                                    |
| T16 | Dot.tsx                                        | Components | XS    | T01                                    |
| T17 | Edge.tsx                                       | Components | S     | T01                                    |
| T18 | Box.tsx                                        | Components | S     | T01                                    |
| T19 | DotsBoard/index.tsx                            | Components | M     | T16, T17, T18, T12                     |
| T20 | ScoreBoard/index.tsx                           | Components | S     | T01                                    |
| T21 | BoardSizePicker/index.tsx                      | Components | XS    | T13                                    |
| T22 | DotsHUD/index.tsx                              | Components | S     | T12, T15                               |
| T23 | Edge claim animation                           | Animations | S     | T17, T19                               |
| T24 | Box claim animation + bonus-turn indicator     | Animations | S     | T18, T20                               |
| T25 | Hint highlight + game-over animations          | Animations | S     | T17, T19, T12                          |
| T26 | GamePage — solo + local modes                  | Page       | L     | T10, T12, T19, T22, T20, T14, T15, T21 |
| T27 | dotsGameMappers.ts                             | Online     | S     | T01                                    |
| T28 | dotsGameService.ts                             | Online     | M     | T27                                    |
| T29 | GamePage — online + friend modes               | Page       | L     | T26, T28                               |

**Total tasks: 29** | XS: 6 | S: 12 | M: 7 | L: 4

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
- [ ] T29 — [ ] Impl — [ ] Test
