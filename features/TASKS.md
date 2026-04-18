# Implementation Plan: NeonArena — Phase 1 (TicTacToe)

## Overview

Build a dark-themed, neon-cyberpunk web game portal with TicTacToe as the flagship game. Players can compete solo (vs AI), locally (pass-and-play), online (random matchmaking), or with a friend via shareable link — all with no account required. The stack is React 19 + TypeScript+SWC (strict) + Vite+ + Tailwind CSS v4 + Firebase (Firestore + RTDB), deployed on Vercel.

## Architecture Decisions

- **Service layer (adapter pattern):** All Firebase access is behind interface contracts in `src/lib/services/`. No component, hook, or store ever imports `firebase/*` directly.
- **Zustand as single source of truth:** Firebase writes are side effects triggered by store actions; `onSnapshot` calls store actions to update state.
- **CSS variables for all colors:** Every color reference uses `--na-*` vars; no raw hex in components.
- **CSS for glyph animations:** Stroke draw-on uses `stroke-dashoffset` keyframes — not GSAP or JS-per-frame.
- **Framer Motion for state-driven UI transitions:** Overlays, drawers, route changes — not for glyph animation.
- **Client-side matchmaking pairing:** No Cloud Functions in Phase 1; second queued player creates the game doc via Firestore transaction.

---

## Task List

### Phase 1: Foundation

---

#### Task 1: Project Scaffold, Toolchain Setup & All Dependencies

**Description:** Initialize the Vite+ project with React 19 and TypeScript+SWC strict mode. Install every bun dependency the project will need upfront — core framework, Firebase, state management, animation, audio, particles, routing, and testing. Configure Tailwind CSS v4, set up path aliases (`@/`), and establish the full folder structure from the spec. Configure `tsconfig.json` with strict settings and verify `vp check` passes on a clean scaffold.

All packages are installed here. No task after this one should introduce a new `bun install`.

**Packages to install:**

| Package                       | Version                     | Purpose                               |
| ----------------------------- | --------------------------- | ------------------------------------- |
| `react`                       | 19.x                        | UI framework                          |
| `react-dom`                   | 19.x                        | DOM renderer                          |
| `react-router-dom`            | 7.x                         | Client-side routing                   |
| `zustand`                     | latest                      | Lightweight state management          |
| `firebase`                    | latest                      | Firestore, RTDB, Anonymous Auth       |
| `framer-motion`               | latest                      | Route transitions, overlay animations |
| `howler`                      | latest                      | Audio playback (SFX + music)          |
| `@tsparticles/react`          | latest                      | Particle background + confetti        |
| `@tsparticles/slim`           | latest                      | Slim tsparticles bundle (perf)        |
| `web-haptics`                 | `github:lochie/web-haptics` | Haptic feedback abstraction           |
| `@types/howler`               | latest                      | TypeScript types for Howler           |
| `@types/react`                | 19.x                        | React types                           |
| `@types/react-dom`            | 19.x                        | ReactDOM types                        |
| `vitest`                      | latest                      | Test runner (via `vp test`)           |
| `@testing-library/react`      | latest                      | Component testing                     |
| `@testing-library/user-event` | latest                      | Realistic user interaction simulation |
| `@testing-library/jest-dom`   | latest                      | Custom DOM matchers                   |
| `tailwindcss`                 | 4.x                         | Utility CSS                           |
| `@vitejs/plugin-react`        | latest                      | Vite React plugin                     |

**Acceptance criteria:**

- [ ] All packages above installed with no peer-dependency conflicts
- [ ] `vp dev` starts the dev server at `localhost:5173` with no errors
- [ ] `vp check` passes (Oxlint + Oxfmt + tsc strict) on the scaffold
- [ ] `@/` path alias resolves to `src/` in both TypeScript and Vite
- [ ] `src/` directory structure matches the spec's project tree exactly (all folders created, even if empty)
- [ ] `tailwind.config.ts` exists and Tailwind v4 classes render in the browser
- [ ] `package.json` lists every dependency — no implicit installs in later tasks

**Verification:**

- [ ] `vp build` produces a `dist/` folder with no errors
- [ ] `vp test` runs (zero tests, zero failures — just confirming Vitest wires up)
- [ ] Manual: browser shows Tailwind-styled placeholder text

**Dependencies:** None

**Files likely touched:**

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- All empty `src/` subdirectory placeholders (`.gitkeep` files)

**Estimated scope:** Medium

---

#### Task 2: Design Tokens & Global Styles

**Description:** Define all CSS custom properties (`--na-*`) in `globals.css` and all keyframe animations in `animations.css`. This establishes the visual foundation every component will use. No component should ever hardcode a hex color after this task.

**Acceptance criteria:**

- [ ] All 14 design tokens from the spec (`--na-bg`, `--na-cyan`, `--na-rose`, `--na-purple`, glows, fonts, breakpoints) defined in `:root`
- [ ] `@keyframes draw-x-stroke`, `draw-o-stroke`, `glow-pulse-win`, `radar-pulse` defined
- [ ] `@media (prefers-reduced-motion: reduce)` block disables all animations
- [ ] Orbitron and Inter fonts loaded (Google Fonts or self-hosted)
- [ ] `--na-glow-x`, `--na-glow-o`, `--na-glow-grid` usable as `filter:` and `box-shadow:` values

**Verification:**

- [ ] `vp check` passes
- [ ] Manual: apply `color: var(--na-cyan)` to any element and confirm correct color renders

**Dependencies:** Task 1

**Files likely touched:**

- `src/styles/globals.css`
- `src/styles/animations.css`

**Estimated scope:** Small

---

#### Task 3: TypeScript Types

**Description:** Define all shared types and interfaces used across the app. These become the compile-time contract — nothing ships until types are clean.

**Acceptance criteria:**

- [ ] `src/types/game.ts` — `GameMode`, `Difficulty`, `BoardCell`, `GameStatus`, `WinResult` exported
- [ ] `src/types/player.ts` — `Player`, `ScoreDoc` exported
- [ ] `src/types/firebase.ts` — `QueueEntry`, `GameDoc`, `PresenceEntry` Firestore shapes exported
- [ ] All types are strict (no `any`, no optional shortcuts)
- [ ] `vp check` passes with zero type errors

**Verification:**

- [ ] `vp check` passes

**Dependencies:** Task 1

**Files likely touched:**

- `src/types/game.ts`
- `src/types/player.ts`
- `src/types/firebase.ts`

**Estimated scope:** Small

---

#### Task 4: Service Layer Interfaces

**Description:** Define the 5 service interfaces that form the backend abstraction contract. No Firebase implementation yet — only the interface files and the `services/index.ts` DI binding file with placeholder stubs so the rest of the codebase can import types.

**Acceptance criteria:**

- [ ] `IAuthService`, `IGameService`, `IScoreService`, `IPresenceService`, `IQueueService` interfaces created in `src/lib/services/interfaces/`
- [ ] All method signatures match the spec exactly (including return types)
- [ ] `src/lib/services/index.ts` exports 5 service constants typed to their interfaces (stubs returning `Promise.resolve()` for now)
- [ ] `vp check` passes

**Verification:**

- [ ] `vp check` passes — all 5 interfaces type-check correctly

**Dependencies:** Task 3

**Files likely touched:**

- `src/lib/services/interfaces/IAuthService.ts`
- `src/lib/services/interfaces/IGameService.ts`
- `src/lib/services/interfaces/IScoreService.ts`
- `src/lib/services/interfaces/IPresenceService.ts`
- `src/lib/services/interfaces/IQueueService.ts`
- `src/lib/services/index.ts`

**Estimated scope:** Medium

---

#### Task 5: Firebase Client Initialization

**Description:** Initialize the Firebase app, Firestore, RTDB, and Anonymous Auth in a single client module. Configure `.env.example` with all required keys. Wire up `FirebaseAuthService` — the anonymous sign-in implementation.

**Acceptance criteria:**

- [ ] `src/lib/firebase/client.ts` initializes Firebase app, exports `db` (Firestore), `rtdb` (RTDB), `auth` instances
- [ ] `.env.example` lists all required `VITE_FIREBASE_*` keys
- [ ] `.env` is in `.gitignore`
- [ ] `FirebaseAuthService` implements `IAuthService` and signs in anonymously
- [ ] `src/lib/services/index.ts` updated: `authService = new FirebaseAuthService()`
- [ ] `vp check` passes

**Verification:**

- [ ] `vp build` succeeds
- [ ] Manual: open browser console, confirm Firebase anonymous UID is logged on app load

**Dependencies:** Task 4

**Files likely touched:**

- `src/lib/firebase/client.ts`
- `src/lib/services/firebase/FirebaseAuthService.ts`
- `src/lib/services/index.ts`
- `.env.example`
- `.gitignore`

**Estimated scope:** Medium

---

#### Task 6: Routing Skeleton

**Description:** Set up React Router v7 with `createBrowserRouter`. Create stub page components for all routes. Verify navigation works between routes without 404s.

**Acceptance criteria:**

- [ ] Routes defined: `/`, `/play/tictactoe`, `/play/tictactoe/nickname`, `/play/tictactoe/matchmaking`, `/play/tictactoe/game`, `/game/:gameId`
- [ ] Each route renders a stub component with a route label (e.g. `<h1>Home</h1>`)
- [ ] Navigating between routes does not cause 404s or white screens
- [ ] `App.tsx` wraps router in a global provider (Zustand stores available everywhere)

**Verification:**

- [ ] `vp build` succeeds
- [ ] Manual: click through all routes in the browser

**Dependencies:** Task 1, Task 3

**Files likely touched:**

- `src/App.tsx`
- `src/pages/Home/index.tsx`
- `src/pages/ModeSelect/index.tsx`
- `src/pages/NicknameEntry/index.tsx`
- `src/pages/Matchmaking/index.tsx`
- `src/pages/Game/index.tsx`

**Estimated scope:** Small

---

### Checkpoint: Foundation

- [ ] `vp check` passes (zero lint, format, type errors)
- [ ] `vp build` produces clean `dist/`
- [ ] All 6 routes render stub content without errors
- [ ] CSS variables visible in browser DevTools on `:root`
- [ ] Firebase anonymous sign-in logs a UID to console

---

### Phase 2: Core Game Logic

---

#### Task 7: Board Logic & Win Detection

**Description:** Implement the pure game logic — the 3×3 board state, win condition checking (all 8 combinations), draw detection, and board utility helpers. This is the most critical unit to get right before any UI work.

**Acceptance criteria:**

- [x] `checkWinner(board)` returns `{ winner: 'X'|'O', line: number[] } | null`
- [x] `isDraw(board)` returns `true` when board is full with no winner
- [x] `getAvailableCells(board)` returns indices of `null` cells
- [x] All 8 win conditions covered (3 rows, 3 cols, 2 diagonals)
- [x] 100% line coverage on `logic.ts`

**Verification:**

- [x] `vp test` passes all cases in `logic.test.ts`
- [x] Coverage report shows 100% for `src/lib/game/logic.ts`

**Dependencies:** Task 3

**Files likely touched:**

- `src/lib/game/logic.ts`
- `src/lib/game/logic.test.ts`

**Estimated scope:** Small

---

#### Task 8: AI Engine — Easy & Medium

**Description:** Implement Easy (random) and Medium (win/block/random) AI strategies. Each is a pure function: takes a board state and returns a cell index.

**Acceptance criteria:**

- [x] `easyMove(board)` returns a random available cell index
- [x] `mediumMove(board, aiMark)` checks for immediate win → immediate block → random
- [x] Both functions never select an occupied cell
- [x] Both functions return `null` on a full board (impossible in practice, guarded)
- [x] 100% line coverage on `easy.ts` and `medium.ts`

**Verification:**

- [x] `vp test` passes for easy/medium tests
- [x] Coverage report shows 100% for both files

**Dependencies:** Task 7

**Files likely touched:**

- `src/lib/ai/easy.ts`
- `src/lib/ai/medium.ts`

**Estimated scope:** Small

---

#### Task 9: AI Engine — Hard (Minimax)

**Description:** Implement the minimax algorithm with alpha-beta pruning. The hard AI must be unbeatable — it will always win or draw from any board state.

**Acceptance criteria:**

- [x] `hardMove(board, aiMark)` returns the optimal cell index using minimax + alpha-beta
- [x] AI never loses in any test scenario (all board permutations tested for correctness)
- [x] AI takes the winning move when one is available
- [x] AI blocks the opponent's winning move
- [x] 100% line coverage on `minimax.ts`

**Verification:**

- [x] `vp test` passes for minimax tests
- [x] Test case: AI presented with winning move — always takes it
- [x] Test case: AI presented with opponent about to win — always blocks

**Dependencies:** Task 7, Task 8

**Files likely touched:**

- `src/lib/ai/minimax.ts`
- `src/lib/ai/minimax.test.ts`

**Estimated scope:** Small

---

#### Task 10: Zustand Game Store

**Description:** Implement the `gameStore` — the central state store for board state, current turn, game mode, game status, and move logic. Online game state updates will plug into this store via `onSnapshot` in a later task.

**Acceptance criteria:**

- [x] `board: BoardCell[9]`, `currentTurn: 'X'|'O'`, `status: GameStatus`, `winner`, `winLine` stored in Zustand
- [x] `makeMove(index)` places a glyph, advances turn, checks win/draw, updates status
- [x] `resetGame()` resets board to initial state, preserves mode/difficulty
- [x] `setMode(mode)`, `setDifficulty(difficulty)` actions exist
- [x] `isMyTurn` derived from `currentTurn` and player role (X or O)
- [x] `useGameStore.test.ts` covers move, win detection, and reset

**Verification:**

- [x] `vp test` passes for `useGameStore.test.ts`
- [x] Manual: import store in browser console, call `makeMove(0)` — board updates

**Dependencies:** Task 3, Task 7

**Files likely touched:**

- `src/hooks/useGameStore.ts`
- `src/hooks/useGameStore.test.ts`

**Estimated scope:** Medium

---

#### Task 11: Zustand Player & Audio Stores

**Description:** Implement `playerStore` (nickname, UID, role, scores) and `audioStore` (volumes, muted state). Both stores persist relevant fields to localStorage.

**Acceptance criteria:**

- [x] `playerStore` holds `nickname`, `uid`, `role: 'X'|'O'|null`, `score: ScoreDoc`
- [x] `playerStore` persists `nickname` and `uid` to localStorage; rehydrates on load
- [x] `audioStore` holds `masterMuted`, `sfxVolume`, `musicVolume`
- [x] `audioStore` persists all fields to localStorage
- [x] `vp check` passes

**Verification:**

- [x] `vp check` passes
- [x] Manual: set nickname, refresh page — nickname rehydrates from localStorage

**Dependencies:** Task 3

**Files likely touched:**

- `src/hooks/usePlayerStore.ts`
- `src/hooks/useAudioStore.ts`

**Estimated scope:** Small

---

### Checkpoint: Core Game Logic

- [x] `vp test` passes — zero failures
- [x] `src/lib/game/logic.ts` at 100% coverage
- [x] `src/lib/ai/` all files at 100% coverage
- [x] All 8 win conditions have explicit test cases
- [x] Hard AI never loses in any test permutation

---

### Phase 3: Game UI (Offline Modes)

---

#### Task 12: GlyphX & GlyphO Components

**Description:** Build the animated SVG glyphs. X draws two diagonal strokes with `stroke-dashoffset` animation; O draws a circle arc. Both render in their brand colors with prominent glow.

**Acceptance criteria:**

- [x] `GlyphX` renders two `<line>` elements in `var(--na-cyan)` with `filter: var(--na-glow-x)`
- [x] `GlyphO` renders a `<circle>` or `<path>` in `var(--na-rose)` with `filter: var(--na-glow-o)`
- [x] When `animate={true}`, strokes draw on via `stroke-dashoffset` CSS animation (200ms for X, sequential strokes; 200ms for O)
- [x] When `animate={false}`, glyphs render instantly (no animation)
- [x] Glyphs scale to fill parent container via `viewBox`
- [x] `useReducedMotion()` hook disables animation when system preference is set

**Verification:**

- [x] `vp check` passes
- [ ] Manual: render both glyphs in isolation — confirm glow visible, draw-on animation plays

**Dependencies:** Task 2, Task 3

**Files likely touched:**

- `src/components/GlyphX/index.tsx`
- `src/components/GlyphO/index.tsx`

**Estimated scope:** Small

---

#### Task 13: GameBoard Component

**Description:** Build the 3×3 TicTacToe grid. Grid lines have a subtle purple glow. Cells are clickable buttons; occupied cells are disabled. Renders glyphs based on board state.

**Acceptance criteria:**

- [x] 3×3 CSS grid with `gap: 2px`, `aspect-ratio: 1`, `max-width: 480px`, centered
- [x] Grid lines styled with `var(--na-glow-grid)` glow via `box-shadow`
- [x] Each cell renders `<GlyphX animate />` or `<GlyphO animate />` based on `board[index]`
- [x] Empty cells are clickable; occupied cells have `disabled` + `cursor: not-allowed`
- [x] `onCellClick(index)` prop called on click; component is controlled (no internal state)
- [x] `aria-label` on each cell for accessibility
- [x] `GameBoard.test.tsx`: renders correct glyphs, clicking occupied cell fires no callback

**Verification:**

- [x] `vp test` passes for `GameBoard.test.tsx`
- [ ] Manual: render board with partial moves — correct glyphs appear, disabled cells unclickable

**Dependencies:** Task 12, Task 10

**Files likely touched:**

- `src/components/GameBoard/index.tsx`
- `src/components/GameBoard/GameBoard.test.tsx`

**Estimated scope:** Medium

---

#### Task 14: PlayerHUD Component

**Description:** Top bar shown during gameplay — displays both player nicknames, W/L/D scores, whose-turn indicator (in the active player's color), mute button, and home button.

**Acceptance criteria:**

- [x] Displays `playerX.nickname` and `playerO.nickname` (or "AI" for solo)
- [x] Active player's name highlighted in their color (`--na-cyan` for X, `--na-rose` for O)
- [x] W/L/D shown as `W: N | L: N | D: N` in Orbitron font
- [x] Mute FAB (🔇/🔊) toggles `audioStore.masterMuted`
- [x] Home button with confirmation dialog before leaving a live game (online modes only)
- [x] Reads state from `useGameStore` and `usePlayerStore`

**Verification:**

- [x] `vp check` passes
- [ ] Manual: render HUD with mock state — turn indicator changes color per turn

**Dependencies:** Task 10, Task 11, Task 2

**Files likely touched:**

- `src/components/PlayerHUD/index.tsx`

**Estimated scope:** Medium

---

#### Task 15: WinOverlay Component

**Description:** Full-screen end-game overlay with winner announcement, confetti particles, score tally, and action buttons. Uses Framer Motion `AnimatePresence` for mount/unmount.

**Acceptance criteria:**

- [x] Shows "YOU WIN", "YOU LOSE", or "DRAW" in large Orbitron text
- [x] Winner's color scheme applied (cyan for X win, rose for O win, purple for draw)
- [x] tsparticles confetti burst fires in winner's color on mount
- [x] Updated W/L/D score displayed
- [x] Two buttons: "Play Again" and "Home"
- [x] Auto-dismisses after 8 seconds with no action
- [x] Framer Motion entrance/exit animation
- [x] `WinOverlay.test.tsx`: renders correct text for each outcome, buttons fire callbacks

**Verification:**

- [x] `vp test` passes for `WinOverlay.test.tsx`
- [ ] Manual: trigger overlay — confetti fires, text correct, auto-dismiss works

**Dependencies:** Task 2, Task 11

**Files likely touched:**

- `src/components/WinOverlay/index.tsx`
- `src/components/WinOverlay/WinOverlay.test.tsx`

**Estimated scope:** Medium

---

#### Task 16: Game Page — vs AI Mode (Full Loop)

**Description:** Wire the Game page to handle the complete offline vs-AI gameplay loop: board renders, player clicks, AI responds after delay, win/draw detected, overlay shown, replay works.

**Acceptance criteria:**

- [x] Player can click any empty cell; glyph renders with animation
- [x] After player move, AI responds in 300–600ms (random delay) using difficulty from store
- [x] AI move also triggers glyph animation
- [x] Win/draw detection fires after each move; `WinOverlay` appears
- [x] Winning line cells pulse with `glow-pulse-win` animation
- [x] "Play Again" resets the board; same mode/difficulty continues
- [x] "Home" navigates to `/`
- [x] `Game.test.tsx`: full vs-AI game can be played to completion in tests

**Verification:**

- [x] `vp test` passes for `Game.test.tsx`
- [ ] Manual: play a full game vs Hard AI — AI responds, win detected, overlay shown

**Dependencies:** Task 13, Task 14, Task 15, Task 9, Task 10

**Files likely touched:**

- `src/pages/Game/index.tsx`
- `src/pages/Game/Game.test.tsx`

**Estimated scope:** Large

---

#### Task 17: Local 2-Player Mode

**Description:** Extend the Game page to support local pass-and-play. Two human players take turns on the same device. Turn indicator is prominent so players know when to pass the device.

**Acceptance criteria:**

- [x] Both players' nicknames rendered in HUD
- [x] Turn indicator shows the active player's color and name
- [x] After a move, turn switches immediately (no AI delay)
- [x] Win/draw detection identical to vs-AI mode
- [x] "Play Again" restores initial turn order (X goes first)

**Verification:**

- [x] `vp check` passes
- [ ] Manual: play a local 2P game to completion on a 375px viewport (mobile simulation)

**Dependencies:** Task 16

**Files likely touched:**

- `src/pages/Game/index.tsx`
- `src/hooks/useGameStore.ts`

**Estimated scope:** Small

---

### Checkpoint: Offline Game Modes

- [x] `vp test` passes — zero failures
- [ ] vs AI: Easy, Medium, Hard all complete a full game correctly
- [ ] Local 2P: pass-and-play works, turn indicator updates correctly
- [ ] WinOverlay: renders for win, loss, and draw; auto-dismisses at 8s
- [ ] Board is perfectly square on 375px, 768px, 1280px viewports (manual check)
- [ ] Glyphs draw on with stroke animation; winning line pulses

---

### Phase 4: Player Identity

---

#### Task 18: NicknameInput Component & Validation

**Description:** Build the validated nickname text input used on the NicknameEntry page. Enforces character rules client-side with real-time error feedback.

**Acceptance criteria:**

- [x] Input accepts 2–16 characters, alphanumeric + underscore only, no spaces
- [x] Default value: `Guest_` + 4 random digits
- [x] Real-time validation error shown below input on invalid input
- [x] "Continue" button disabled until input is valid
- [x] `NicknameInput.test.tsx`: rejects <2 chars, >16 chars, spaces, specials; accepts valid
- [x] Styled with neon theme (border glows on focus using `--na-cyan`)

**Verification:**

- [x] `vp test` passes for `NicknameInput.test.tsx`
- [ ] Manual: try invalid nicknames — correct error messages appear

**Dependencies:** Task 2, Task 11

**Files likely touched:**

- `src/components/NicknameInput/index.tsx`
- `src/components/NicknameInput/NicknameInput.test.tsx`

**Estimated scope:** Small

---

#### Task 19: NicknameEntry Page

**Description:** Build the full NicknameEntry page flow. For Local 2P mode, two nicknames are entered sequentially. For all other modes, one nickname. If returning player has saved nickname, it pre-fills and can be skipped.

**Acceptance criteria:**

- [x] Displays mode context (e.g. "Playing: vs AI — Hard")
- [x] For Local 2P: shows "Player 1" step, then "Player 2" step — sequential
- [x] Saved nickname pre-filled from `playerStore`; user can edit or confirm and skip
- [x] On submit: nickname saved to `playerStore` + localStorage; navigates to next step
- [x] Triggers `authService.signInAnonymously()` if UID not yet set
- [x] `NicknameEntry.test.tsx`: single-player flow and 2P sequential flow tested

**Verification:**

- [x] `vp test` passes for `NicknameEntry.test.tsx`
- [ ] Manual: full flow from ModeSelect → NicknameEntry → Game with saved + new nickname

**Dependencies:** Task 18, Task 5, Task 11, Task 6

**Files likely touched:**

- `src/pages/NicknameEntry/index.tsx`
- `src/pages/NicknameEntry/NicknameEntry.test.tsx`

**Estimated scope:** Medium

---

#### Task 20: Firebase Score Service

**Description:** Implement `FirebaseScoreService` — read a player's W/L/D record from Firestore and increment it after game end.

**Acceptance criteria:**

- [x] `FirebaseScoreService` implements `IScoreService` fully
- [x] `getScore(uid)` reads from `scores/{uid}` — returns `null` if no doc yet
- [x] `incrementScore(uid, result, nickname)` atomically increments the correct counter using Firestore `increment()`
- [x] Creates score doc on first game if it doesn't exist
- [x] `src/lib/services/index.ts` updated: `scoreService = new FirebaseScoreService()`
- [x] All Firebase calls are inside this service class only

**Verification:**

- [x] `vp build` succeeds
- [ ] Manual: play a game to completion — check Firestore console for score increment

**Dependencies:** Task 4, Task 5

**Files likely touched:**

- `src/lib/services/firebase/FirebaseScoreService.ts`
- `src/lib/services/index.ts`

**Estimated scope:** Small

---

#### Task 21: Score Hook & HUD Integration

**Description:** Connect the `useScore` hook to the game lifecycle — fetch scores on game start, update scores on game end, display in PlayerHUD.

**Acceptance criteria:**

- [x] `useScore(uid)` fetches score from `scoreService.getScore()` on mount
- [x] Score stored in `playerStore`
- [x] At game end, `scoreService.incrementScore()` called with correct result
- [x] HUD displays live W/L/D from store
- [x] Score persists across page refresh (same UID recovered from localStorage)

**Verification:**

- [x] `vp build` succeeds
- [ ] Manual: play 3 games — W/L/D increments correctly; refresh page — scores persist

**Dependencies:** Task 20, Task 14, Task 11

**Files likely touched:**

- `src/hooks/useScore.ts`
- `src/pages/Game/index.tsx`
- `src/components/PlayerHUD/index.tsx`

**Estimated scope:** Small

---

### Phase 5: Portal Home

---

#### Task 22: ParticleBackground Component

**Description:** Ambient tsparticles particle drift for the home screen background. The same tsparticles instance is reconfigured for confetti on win (already in WinOverlay).

**Acceptance criteria:**

- [ ] `ParticleBackground` renders full-viewport tsparticles canvas behind content
- [ ] Particles drift slowly in `--na-purple` and `--na-cyan` colors at low opacity
- [ ] Canvas is `z-index: 0`; all content sits above it
- [ ] Particle animation disabled when `prefers-reduced-motion` is set
- [ ] Component mounts/unmounts without memory leaks (proper tsparticles cleanup)

**Verification:**

- [ ] `vp check` passes
- [ ] Manual: home screen shows subtle ambient particles

**Dependencies:** Task 2

**Files likely touched:**

- `src/components/ParticleBackground/index.tsx`

**Estimated scope:** Small

---

#### Task 23: GameCard & ModeCard Components

**Description:** Build the `GameCard` (portal home card per game) and `ModeCard` (mode selection card). Both need distinct active and "Coming Soon" visual states.

**Acceptance criteria:**

- [ ] `GameCard` shows game thumbnail, title, and optionally a "Coming Soon" badge
- [ ] Active `GameCard` has hover glow intensify (Framer Motion `whileHover`)
- [ ] "Coming Soon" cards are visually dimmed (50% opacity) and non-interactive (`pointer-events: none`)
- [ ] `ModeCard` shows icon, title, short description; highlights with border glow on selection
- [ ] Both components use only `--na-*` CSS vars for colors

**Verification:**

- [ ] `vp check` passes
- [ ] Manual: hover active GameCard — glow intensifies; "Coming Soon" card is not clickable

**Dependencies:** Task 2

**Files likely touched:**

- `src/components/GameCard/index.tsx`
- `src/components/ModeCard/index.tsx`

**Estimated scope:** Small

---

#### Task 24: Home Page

**Description:** Build the full arcade portal home. Game cards in a responsive grid, global online player count badge, ambient particle background, and navigation to mode selection.

**Acceptance criteria:**

- [ ] Responsive grid: 1 col (375px) → 2 col (768px) → 3 col (1280px)
- [ ] TicTacToe card is active and navigates to `/play/tictactoe` on click
- [ ] Chess, Checkers, Battleship cards show "Coming Soon" badge and are non-interactive
- [ ] `OnlineCounter` badge shows `🟢 N players online` (mocked for now; real data in Phase 7)
- [ ] `ParticleBackground` renders behind cards
- [ ] Page title uses Orbitron font; loads in < 1.5s FCP (Lighthouse target)
- [ ] `Home.test.tsx`: renders 4 game cards, TicTacToe is clickable, others are not

**Verification:**

- [ ] `vp test` passes for `Home.test.tsx`
- [ ] Manual: responsive grid renders correctly at all 3 breakpoints

**Dependencies:** Task 22, Task 23, Task 6

**Files likely touched:**

- `src/pages/Home/index.tsx`
- `src/pages/Home/Home.test.tsx`
- `src/components/OnlineCounter/index.tsx`

**Estimated scope:** Medium

---

#### Task 25: ModeSelect Page

**Description:** Build the mode selection screen for TicTacToe. Shows 4 mode cards; tapping one stores the selection and navigates to NicknameEntry. For vs-AI mode, difficulty selection appears inline.

**Acceptance criteria:**

- [ ] 4 `ModeCard` components: "vs AI", "Local 2P", "Online Random", "Play with Friend"
- [ ] Each card has descriptive icon and subtitle
- [ ] Tapping "vs AI" reveals a difficulty selector (Easy / Medium / Hard) before proceeding
- [ ] On mode confirm: mode + difficulty stored in `gameStore`; navigate to `/play/tictactoe/nickname`
- [ ] Back button returns to `/`
- [ ] `ModeSelect.test.tsx`: mode selection triggers correct navigation

**Verification:**

- [ ] `vp test` passes for `ModeSelect.test.tsx`
- [ ] Manual: tap each mode → correct next screen appears

**Dependencies:** Task 23, Task 10, Task 6

**Files likely touched:**

- `src/pages/ModeSelect/index.tsx`
- `src/pages/ModeSelect/ModeSelect.test.tsx`

**Estimated scope:** Medium

---

---

#### Task 25.5: UI Design Pass — Pre-Game Screens

**Description:** Apply the full NeonArena visual design to all pre-game screens. These pages are functional stubs; this task makes them production-grade. The goal is "aggressive, electric, nostalgic" arcade energy — something players will remember and return to. Design system changes (fonts, spacing tokens) are also locked in here before online multiplayer UI is built.

**Scope:** Home, ModeSelect, NicknameEntry, Matchmaking pages + global design tokens update. Does NOT touch GameBoard, WinOverlay, or PlayerHUD (those are designed post-game-logic stabilisation).

**Design direction:**
- Dark theme (near-black background, viewed at night/indoors by competitive casual players)
- Fonts: replace Inter body font with a non-reflex pairing that suits "aggressive + electric + nostalgic" — see `.impeccable.md` for full design context
- OKLCH color system: keep brand hues (cyan, rose, purple) but migrate raw hex tokens to OKLCH in CSS for perceptually uniform mixing
- Asymmetric layouts, varied spacing rhythm — not centered everything
- Framer Motion page transitions between routes
- No glassmorphism, no gradient text, no side-stripe card borders

**Acceptance criteria:**

- [ ] `globals.css` updated: body font changed from Inter to chosen replacement; OKLCH values for all `--na-*` tokens
- [ ] Home page: arcade portal feel — game cards with hover states, animated entrance, particle background active, `OnlineCounter` badge visible
- [ ] ModeSelect page: 4 mode cards with icons, descriptions, and clear selection affordance; difficulty selector inline for vs AI
- [ ] NicknameEntry page: styled input with focus glow, default nickname pre-filled, validation errors styled
- [ ] Matchmaking page: radar pulse animation, queue count, AI fallback prompt at 30s — all visually polished
- [ ] Framer Motion route transitions wired between all 4 pages
- [ ] All pages pass `vp check` (no TS errors, no lint errors)
- [ ] All pages responsive at 375px, 768px, 1280px

**Verification:**

- [ ] Manual: navigate all 4 screens — no layout breaks at mobile and desktop
- [ ] Manual: the AI slop test — show it to someone and ask "does this look generic?" — answer must be no
- [ ] `vp check` passes

**Dependencies:** Task 24, Task 25, Task 18, Task 19

**Files likely touched:**

- `src/styles/globals.css`
- `src/pages/Home/index.tsx`
- `src/pages/ModeSelect/index.tsx`
- `src/pages/NicknameEntry/index.tsx`
- `src/pages/Matchmaking/index.tsx`
- `src/components/GameCard/index.tsx`
- `src/components/ModeCard/index.tsx`
- `src/components/NicknameInput/index.tsx`
- `src/components/OnlineCounter/index.tsx`
- `src/App.tsx` (route transition wrapper)

**Estimated scope:** Large

---

### Checkpoint: Portal & Identity

- [ ] `vp test` passes — zero failures
- [ ] Full navigation flow: Home → ModeSelect → NicknameEntry → Game works
- [ ] Returning user: nickname pre-filled from localStorage
- [ ] Scores save to Firestore and reload after refresh
- [ ] Home page responsive grid correct at 375px / 768px / 1280px
- [ ] UI design pass complete: all pre-game screens are production-grade and visually distinctive

---

### Phase 6: Audio & Haptics

---

#### Task 26: Haptic Manager

**Description:** Implement `hapticManager.ts` — the abstraction layer over `web-haptics`. All haptic calls are wrapped in try/catch and fail silently on unsupported devices.

**Acceptance criteria:**

- [ ] `hapticManager.place()` fires a 50ms haptic
- [ ] `hapticManager.win()` fires a triple pulse pattern `[80, 60, 80, 60, 80]`
- [ ] `hapticManager.tap()` fires a 20ms haptic
- [ ] All three methods wrapped in `try/catch` — no unhandled exceptions on desktop
- [ ] `web-haptics` imported as the library, not `navigator.vibrate` directly

**Verification:**

- [ ] `vp check` passes
- [ ] Manual: on a supported mobile device, place a tile — haptic fires

**Dependencies:** Task 1

**Files likely touched:**

- `src/lib/haptics/hapticManager.ts`

**Estimated scope:** Small (XS)

---

#### Task 27: Audio Manager

**Description:** Implement the Howler.js singleton `audioManager`. Handles all SFX and music playback, volume control, mute state, and music crossfade between home and game screens.

**Acceptance criteria:**

- [ ] `audioManager` singleton initialized on first user gesture (not on import)
- [ ] `audioManager.play(sound)` plays: `place`, `win`, `lose`, `draw`, `click`
- [ ] `audioManager.playMusic(track)` plays `bg-home` or `bg-game` in a seamless loop
- [ ] Music crossfades (500ms fade) when `playMusic` is called with a different track
- [ ] `audioManager.setMuted(bool)` silences/restores everything instantly
- [ ] `audioManager.setSfxVolume(0–1)` and `setMusicVolume(0–1)` work independently
- [ ] Reads initial muted/volume state from `audioStore`

**Verification:**

- [ ] `vp build` succeeds (audio files in `public/audio/` load correctly)
- [ ] Manual: click a cell — `place.mp3` plays; win — `win.mp3` plays; crossfade on navigation

**Dependencies:** Task 11, Task 26

**Files likely touched:**

- `src/lib/audio/audioManager.ts`
- `public/audio/` (add placeholder audio files)

**Estimated scope:** Medium

---

#### Task 28: SettingsPanel & Audio Integration

**Description:** Build the slide-in settings drawer. Wire haptics and audio triggers to all game events.

**Acceptance criteria:**

- [ ] `SettingsPanel` slides in via Framer Motion from the right; dismissible
- [ ] Contains: Master Mute toggle, SFX volume slider (0–100%), Music volume slider (0–100%)
- [ ] Settings changes update `audioStore` and call `audioManager` immediately
- [ ] Settings persisted to localStorage via `audioStore`
- [ ] Gear icon on home page and in-game HUD opens the panel
- [ ] Audio triggers wired: cell placement → `place`, win → `win`, lose → `lose`, draw → `draw`, button taps → `click`
- [ ] Haptic triggers wired: cell placement → `hapticManager.place()`, win → `hapticManager.win()`, button taps → `hapticManager.tap()`

**Verification:**

- [ ] `vp check` passes
- [ ] Manual: open settings, adjust music volume — music volume changes in real-time

**Dependencies:** Task 27, Task 16

**Files likely touched:**

- `src/components/SettingsPanel/index.tsx`
- `src/pages/Game/index.tsx`
- `src/pages/Home/index.tsx`

**Estimated scope:** Medium

---

### Checkpoint: Audio & Haptics

- [ ] `vp test` passes — zero failures
- [ ] All 5 SFX play on correct game events
- [ ] Music crossfades between home and game
- [ ] Mute silences everything instantly; volume sliders work
- [ ] Settings persist across page refresh
- [ ] Haptics fire on move (silently ignored on desktop)

---

### Phase 7: Online Multiplayer

---

#### Task 29: Firebase Presence Service

**Description:** Implement `FirebasePresenceService` using Firebase RTDB presence pattern. Each connected client writes to `/presence/{uid}`; the entry is removed automatically via `onDisconnect` on tab close.

**Acceptance criteria:**

- [ ] `FirebasePresenceService` implements `IPresenceService`
- [ ] `connect(uid, nickname)` writes to `/presence/{uid}` and sets `onDisconnect` cleanup
- [ ] `disconnect(uid)` manually removes the entry (for clean logout/leave)
- [ ] `subscribeToCount(cb)` listens to `/presence` child count in real-time; fires callback with count
- [ ] `src/lib/services/index.ts` updated: `presenceService = new FirebasePresenceService()`
- [ ] `usePresence` hook calls `presenceService.connect()` on mount, `disconnect()` on unmount

**Verification:**

- [ ] `vp build` succeeds
- [ ] Manual: open two tabs — counter shows 2; close one tab — counter drops to 1 within 5s

**Dependencies:** Task 4, Task 5

**Files likely touched:**

- `src/lib/services/firebase/FirebasePresenceService.ts`
- `src/lib/services/index.ts`
- `src/hooks/usePresence.ts`

**Estimated scope:** Small

---

#### Task 30: OnlineCounter Component (Live Data)

**Description:** Wire the `OnlineCounter` component to real Firebase presence data. Replace the mock from Task 24.

**Acceptance criteria:**

- [ ] `OnlineCounter` subscribes to `presenceService.subscribeToCount()` via `usePresence` hook
- [ ] Displays `🟢 {N} players online` in real-time
- [ ] Shows last known count if Firebase connection drops (no flash to 0)
- [ ] Rendered in home page header and in-game HUD (smaller size in HUD)
- [ ] Subscribes on mount, unsubscribes on unmount (no memory leaks)

**Verification:**

- [ ] `vp build` succeeds
- [ ] Manual: open 3 tabs — counter shows 3 on all tabs; close one — others update

**Dependencies:** Task 29, Task 24

**Files likely touched:**

- `src/components/OnlineCounter/index.tsx`
- `src/hooks/usePresence.ts`

**Estimated scope:** Small

---

#### Task 31: Firebase Queue & Game Services

**Description:** Implement `FirebaseQueueService` and `FirebaseGameService` — the two most complex Firebase service implementations. These power all online game modes.

**Acceptance criteria:**

- [ ] `FirebaseQueueService`: `enqueue`, `dequeue`, `subscribeToQueue` implemented
- [ ] `FirebaseGameService.createGame(playerX)` creates a Firestore doc in `games/`, returns `gameId`
- [ ] `FirebaseGameService.joinGame(gameId, playerO)` sets `playerO` and flips status to `active`
- [ ] `FirebaseGameService.makeMove(gameId, cellIndex, player)` writes move to `board[cellIndex]`, advances `currentTurn`; uses Firestore transaction to prevent race conditions
- [ ] `FirebaseGameService.subscribeToGame(gameId, cb)` wires `onSnapshot` listener
- [ ] `FirebaseGameService.setDisconnected(gameId, uid)` writes `disconnectedAt` timestamp
- [ ] `FirebaseGameService.acceptRematch(gameId, uid)` writes `rematch[uid] = true`; if both true, creates new game doc and returns new `gameId`
- [ ] All Firebase calls inside service class only; no imports in hooks or components

**Verification:**

- [ ] `vp build` succeeds
- [ ] Manual: two browser tabs — one creates game, other joins — Firestore console shows correct doc

**Dependencies:** Task 4, Task 5

**Files likely touched:**

- `src/lib/services/firebase/FirebaseQueueService.ts`
- `src/lib/services/firebase/FirebaseGameService.ts`
- `src/lib/services/index.ts`

**Estimated scope:** Large

---

#### Task 32: Online Game Hook (useOnlineGame)

**Description:** Build `useOnlineGame` — the hook that bridges Firebase real-time game state into the Zustand `gameStore`. Handles `onSnapshot` subscription, turn validation, disconnect detection, and rematch.

**Acceptance criteria:**

- [ ] `useOnlineGame(gameId)` subscribes to `gameService.subscribeToGame()`
- [ ] On each snapshot, calls `gameStore` actions to update board, turn, status, winner
- [ ] Turn validation: `makeMove` blocked if `currentTurn !== myUid`
- [ ] Disconnect detection: if `disconnectedAt` set and 30s elapsed, call `gameStore.setWinner(myRole)` and show win overlay
- [ ] Rematch: `acceptRematch(gameId)` → if both accepted, navigate to new game URL
- [ ] Unsubscribes `onSnapshot` on hook unmount (no memory leaks)

**Verification:**

- [ ] `vp build` succeeds
- [ ] Manual: two tabs play a game — moves sync in < 500ms; closing opponent tab triggers win after 30s

**Dependencies:** Task 31, Task 10

**Files likely touched:**

- `src/hooks/useOnlineGame.ts`

**Estimated scope:** Medium

---

#### Task 33: Matchmaking Page & Flow

**Description:** Build the Matchmaking page — the "Searching for opponent..." screen with animated radar indicator, live queue count, and 30-second AI fallback offer.

**Acceptance criteria:**

- [ ] `radar-pulse` CSS animation plays on the matchmaking screen
- [ ] Shows live queue count from `queueService.subscribeToQueue()`
- [ ] On enter: `queueService.enqueue()` called; listener starts
- [ ] Pairing logic: second player to join queue creates a `games` doc via `gameService.createGame()` + `gameService.joinGame()` in a Firestore transaction; both players navigate to `/play/tictactoe/game`
- [ ] After 30s with no match: "No opponent found — play vs AI instead?" prompt appears
- [ ] On leave (back button): `queueService.dequeue()` called
- [ ] `Matchmaking.test.tsx`: dequeue called on unmount, AI fallback offered after 30s

**Verification:**

- [ ] `vp test` passes for `Matchmaking.test.tsx`
- [ ] Manual: two tabs enter matchmaking — both navigate to game within 10s

**Dependencies:** Task 31, Task 32, Task 6

**Files likely touched:**

- `src/pages/Matchmaking/index.tsx`
- `src/pages/Matchmaking/Matchmaking.test.tsx`
- `src/hooks/useMatchmaking.ts`

**Estimated scope:** Large

---

#### Task 34: Online Random Game Mode (End-to-End)

**Description:** Wire the full online random match flow — matchmaking through game completion, including rematch, disconnect handling, and leave-game confirmation dialog.

**Acceptance criteria:**

- [ ] Two real browser tabs can: match, play a complete game, see win/loss overlay
- [ ] Rematch: both players click "Play Again" → new game starts with same sides
- [ ] Decline rematch: either player clicks "Home" → both see "Opponent declined" and navigate home
- [ ] Disconnect: closing one tab → other player wins after 30s
- [ ] Leave mid-game: confirmation dialog appears; if confirmed, `gameService.setDisconnected()` called
- [ ] Firestore rules enforce turn order (server-side rejection of out-of-turn writes)

**Verification:**

- [ ] `vp build` succeeds
- [ ] Manual: full 2-tab online game including rematch and disconnect handling

**Dependencies:** Task 32, Task 33, Task 15

**Files likely touched:**

- `src/pages/Game/index.tsx`
- `src/hooks/useOnlineGame.ts`

**Estimated scope:** Medium

---

#### Task 35: Play with Friend Mode (Shareable Link)

**Description:** Implement the "Play with Friend" flow — host creates a game, gets a shareable URL, waits for friend to join. Friend opens the link, enters nickname, and joins as O.

**Acceptance criteria:**

- [ ] Selecting "Play with Friend" → NicknameEntry → creates game doc → navigates to `/game/{gameId}`
- [ ] Host sees: locked board + shareable link (`neonarena.app/game/{gameId}`) + one-tap copy button + "Waiting for friend..."
- [ ] Visiting `/game/{gameId}` as a new user → NicknameEntry → `gameService.joinGame()` → game starts
- [ ] If friend visits after host left: "Host left" message shown
- [ ] Game doc `expiresAt` set to 10 minutes; visiting expired link shows "Game expired"
- [ ] Game proceeds identically to online random mode (same hooks, same sync)
- [ ] `FriendLobby.test.tsx`: host waiting state renders; copy button copies correct URL

**Verification:**

- [ ] `vp test` passes for `FriendLobby.test.tsx`
- [ ] Manual: host creates link, friend opens in new tab — game starts correctly

**Dependencies:** Task 34, Task 31

**Files likely touched:**

- `src/pages/Game/index.tsx`
- `src/pages/NicknameEntry/index.tsx`
- `src/pages/FriendLobby/index.tsx` (new page for waiting state)
- `src/pages/FriendLobby/FriendLobby.test.tsx`

**Estimated scope:** Medium

---

### Checkpoint: Online Multiplayer

- [ ] `vp test` passes — zero failures
- [ ] Two browser tabs can match, play, and complete a game
- [ ] Rematch flow works (both accept → new game; one declines → both go home)
- [ ] Disconnect handling: closing tab → opponent wins after 30s
- [ ] Play with Friend: shareable link works; expired link shows error
- [ ] Online player count updates in real-time on home screen

---

### Phase 8: Polish & Hardening

---

#### Task 36: Firestore Security Rules

**Description:** Write and deploy the production Firestore security rules. Prevents players from writing to game docs they don't participate in, other players' score records, or queue entries they don't own.

**Acceptance criteria:**

- [ ] Queue: authenticated users can read all; write only own `{uid}` document
- [ ] Games: authenticated users can read all; create any; update only if `playerX.uid` or `playerO.uid` matches `request.auth.uid`
- [ ] Scores: authenticated users can read all; write only own `{uid}` document
- [ ] Rules deployed to Firebase project (`firebase deploy --only firestore:rules`)
- [ ] Manual test: attempting to write to another user's score document fails with permission error

**Verification:**

- [ ] Firebase console shows rules deployed
- [ ] Manual: from browser console, try to write to `scores/fake-uid` — rejected with 403

**Dependencies:** Task 31

**Files likely touched:**

- `firestore.rules`
- `firebase.json`

**Estimated scope:** Small

---

#### Task 37: Edge Cases & Error States

**Description:** Handle all edge cases from the spec — offline detection, connection loss banner, invalid board states, rapid double-tap, sound autoplay blocked, and stale queue entries.

**Acceptance criteria:**

- [ ] "Connection lost" banner shown when Firebase disconnects; moves disabled
- [ ] Banner dismisses automatically on reconnect
- [ ] Rapid double-tap on a cell: second tap ignored (cell locked after first placement)
- [ ] Board full with no winner correctly triggers draw overlay (no crash)
- [ ] If Firebase unavailable, vs AI and Local 2P still work offline
- [ ] "No opponent found" message shown correctly after 30s matchmaking timeout
- [ ] `gameService.makeMove` validates it's the player's turn before writing to Firestore

**Verification:**

- [ ] `vp check` passes
- [ ] Manual: throttle network to offline mid-game — connection banner appears; resume — game continues

**Dependencies:** Task 34

**Files likely touched:**

- `src/pages/Game/index.tsx`
- `src/hooks/useOnlineGame.ts`
- `src/components/PlayerHUD/index.tsx`

**Estimated scope:** Medium

---

#### Task 38: Accessibility & Reduced-Motion Audit

**Description:** Audit all interactive elements for accessibility. Ensure `prefers-reduced-motion` disables all non-essential animations. Verify color is never the only differentiator.

**Acceptance criteria:**

- [ ] All buttons, cells, inputs have visible focus states
- [ ] `useReducedMotion()` called in all animated components; animations skipped when true
- [ ] `@media (prefers-reduced-motion: reduce)` block in `animations.css` covers all keyframes
- [ ] Cells labeled with `aria-label` describing index and contents
- [ ] X/O distinguishable by shape alone (not just color) — confirmed by viewing in grayscale
- [ ] Mute button reachable by keyboard

**Verification:**

- [ ] `vp check` passes
- [ ] Manual: enable "Reduce Motion" in OS — all animations stop
- [ ] Manual: tab through game board — all cells reachable and labeled

**Dependencies:** Task 13, Task 15, Task 12

**Files likely touched:**

- `src/styles/animations.css`
- `src/components/GameBoard/index.tsx`
- `src/components/WinOverlay/index.tsx`
- `src/components/GlyphX/index.tsx`
- `src/components/GlyphO/index.tsx`

**Estimated scope:** Small

---

#### Task 39: Performance Audit & Bundle Optimization

**Description:** Run Lighthouse on the production build. Lazy-load game modules to hit < 300KB gzipped initial bundle. Verify FCP < 1.5s on simulated 4G.

**Acceptance criteria:**

- [ ] Game page code-split into its own chunk (lazy import in router)
- [ ] Firebase SDK imports are tree-shaken (only used modules imported)
- [ ] Lighthouse mobile FCP < 1.5s on simulated 4G (Lighthouse DevTools panel)
- [ ] `vp build` gzipped JS bundle < 300KB (report from build output)
- [ ] Audio files < 50KB each (compress if needed)
- [ ] tsparticles: use slim bundle (`@tsparticles/slim`) if full bundle exceeds budget

**Verification:**

- [ ] Lighthouse report shows FCP < 1.5s
- [ ] `vp build` output shows bundle sizes within target

**Dependencies:** Task 28, Task 34

**Files likely touched:**

- `src/App.tsx` (lazy imports)
- `vite.config.ts`

**Estimated scope:** Small

---

### Checkpoint: Polish & Hardening

- [ ] `vp test` passes — zero failures
- [ ] `vp check` passes — zero errors
- [ ] Firestore rules deployed and tested
- [ ] All edge cases from spec handled
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Lighthouse FCP < 1.5s on simulated 4G
- [ ] JS bundle < 300KB gzipped

---

### Phase 9: Deploy

---

#### Task 40: Vercel Deployment

**Description:** Configure and deploy the production build to Vercel. Set up environment variables, verify all Firebase features work on the live domain.

**Acceptance criteria:**

- [ ] `vercel.json` configured with correct build command (`vp build`) and output directory (`dist/`)
- [ ] All `VITE_FIREBASE_*` environment variables set in Vercel project settings
- [ ] App accessible at `*.vercel.app` with no console errors
- [ ] `/game/:gameId` deep link resolves correctly (Vercel SPA rewrite configured)
- [ ] Firebase Anonymous Auth, Firestore, and RTDB work on the deployed domain

**Verification:**

- [ ] Open deployed URL in a private browser — full game flow works
- [ ] Open `/game/test-id` directly — 404 does not appear (SPA rewrite works)
- [ ] Two devices can play an online game against each other via the deployed URL

**Dependencies:** All previous tasks

**Files likely touched:**

- `vercel.json`

**Estimated scope:** Small

---

#### Task 41: Final Smoke Test & Success Criteria Sign-Off

**Description:** Run through every item in the SPEC's "Success Criteria" checklist. Document any failures and fix them before marking Phase 1 done.

**Acceptance criteria:**

- [ ] Every item in SPEC.md § Success Criteria marked as passing
- [ ] `vp test` passes with zero failures on CI
- [ ] `vp build` completes with zero errors or warnings
- [ ] Manual: smoke test all 4 game modes on a real mobile device
- [ ] Manual: smoke test shareable link flow end-to-end
- [ ] Firestore rules reject out-of-turn writes (confirmed in browser console)

**Verification:**

- [ ] All 35 SPEC success criteria checkboxes ticked
- [ ] Zero open bugs from smoke test

**Dependencies:** Task 40

**Files likely touched:** Various (bug fixes only)

**Estimated scope:** Small

---

### Checkpoint: Phase 1 Complete

- [ ] `vp test` passes — zero failures
- [ ] `vp build` — zero errors or warnings
- [ ] App deployed to Vercel and publicly accessible
- [ ] All 4 game modes work end-to-end on the deployed URL
- [ ] Scores, presence, matchmaking all functional in production
- [ ] Lighthouse FCP < 1.5s, bundle < 300KB gzipped
- [ ] All SPEC success criteria signed off

---

## Risks and Mitigations

| Risk                                                        | Impact | Mitigation                                                                                                   |
| ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Matchmaking race condition (3+ players join simultaneously) | Medium | Use Firestore transaction in pairing logic (Task 33); only one client successfully claims the waiting player |
| Firebase costs spike unexpectedly                           | High   | Set Firebase budget alerts before deploying; cache `onSnapshot` results in Zustand to minimize reads         |
| `web-haptics` library unmaintained / broken                 | Low    | Abstraction layer in `hapticManager.ts` — swap to `navigator.vibrate` by changing one file                   |
| Audio autoplay blocked on load                              | Low    | `audioManager` initialized on first user gesture; confirmed with browser gesture event                       |
| Hard AI performance on low-end mobile                       | Medium | Minimax with alpha-beta pruning is fast for 3×3; profile in Task 9 if needed                                 |
| tsparticles bundle too large                                | Medium | Use `@tsparticles/slim` slim bundle; lazy-load particle config                                               |
| Firestore `onSnapshot` leak on unmount                      | Medium | All hooks return and call unsubscribe function; verified in Task 32 and Task 33                              |

## Open Questions

None. All decisions resolved per `PRD.md § 17 — Resolved Decisions`.

---

## Parallelization Opportunities

Once Foundation (Tasks 1–6) is complete, the following can be parallelized:

| Parallel Track A                 | Parallel Track B                |
| -------------------------------- | ------------------------------- |
| Task 7 → 8 → 9 (AI engine)       | Task 11 (Player & Audio stores) |
| Task 12 → 13 (Glyphs + Board)    | Task 18 (NicknameInput)         |
| Task 22 → 23 (Particles + Cards) | Task 26 (Haptic Manager)        |

Online multiplayer tasks (29–35) must be sequential — each builds on the previous service layer piece.
