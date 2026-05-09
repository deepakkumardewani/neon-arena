# Spec: NeonArena — Connect 4

> **Status:** Ready for implementation
> **Last updated:** 2026-05-07
> **Parent spec:** `agent_docs/SPEC.md`
> **Rules reference:** `src/lib/game/rules/connect4.md`

---

## Objective

Add Connect 4 as a first-class game in NeonArena. Same neon-cyberpunk aesthetic, same 4-mode structure (solo, local, online, friend), same routing shell, same Firebase backend. The game is visually satisfying — discs animate falling through the column with gravity — and strategically interesting enough to warrant a Hard AI with genuine threat analysis.

### Who is the user?

- **Casual player** — wants a clean board, satisfying drop animation, and a fair Easy AI
- **Competitive player** — wants a Hard AI that blocks threats and plays center-weighted strategy
- **Local pair** — pass-and-play on one device, color-coded discs
- **Online player** — matched against a random opponent via Firebase queue

### What does success look like?

- All 4 game modes are playable end-to-end
- AI responds in < 600ms on Easy/Medium, < 1.5s on Hard
- Gravity animation (disc falling) feels crisp and reads clearly on every drop
- Board renders correctly on 375px mobile width; column tap targets ≥ 44px wide
- Winning 4 discs are highlighted immediately and unmistakably
- Online sync lag < 300ms on a good connection

---

## Routing

Mirror the TicTacToe / Chess / Dots & Boxes routing pattern exactly:

```
/play/connect4                    → ModeSelectPage       (shared, driven by gameConfig)
/play/connect4/nickname           → NicknameEntryPage    (shared, pass gameType="connect4")
/play/connect4/matchmaking        → MatchmakingPage      (shared, pass gameType="connect4")
/play/connect4/game               → Connect4GamePage     (game-specific layout + logic)
/game/connect4/:gameId            → Connect4GamePage     (online / friend — Firebase doc)
```

`ModeSelectPage`, `NicknameEntryPage`, and `MatchmakingPage` are shared across all games via the `GameConfig` abstraction established by Chess.

`Connect4GamePage` is game-specific because the layout differs (vertical board, column-drop controls, no piece sidebar, no promotion modal — instead: turn indicator, column hover arrow, win overlay with highlighted discs).

---

## File & Folder Structure

All Connect 4 code lives under `src/` but is cleanly scoped. No Chess, TicTacToe, or Dots & Boxes files are modified except where shared types are extended.

```
src/
├── pages/
│   └── Connect4/
│       └── GamePage.tsx                # Game-specific shell
│
├── components/
│   └── connect4/
│       ├── Connect4Board/
│       │   ├── index.tsx               # Grid layout, cell rendering, column interaction
│       │   ├── Cell.tsx                # Single cell — empty, Player 1, or Player 2 disc
│       │   ├── ColumnDropZone.tsx      # Invisible hit area + hover arrow per column
│       │   └── WinLine.tsx             # Overlay that highlights the 4 winning cells
│       ├── Connect4HUD/
│       │   └── index.tsx               # Turn indicator chip + hint token counter
│       └── Connect4ScoreBoard/
│           └── index.tsx               # Win/draw counts across sessions (local display)
│
├── lib/
│   └── connect4/
│       ├── engine/
│       │   ├── rules.ts                # Pure rules: dropDisc, checkWin, checkDraw
│       │   ├── ai.ts                   # Difficulty router → easy/medium/hard strategies
│       │   ├── aiEasy.ts               # Random valid column
│       │   ├── aiMedium.ts             # Win-first, block-second, center-weighted heuristic
│       │   └── aiHard.ts               # Minimax + alpha-beta, threat scoring, center preference
│       ├── hints/
│       │   ├── useHintSystem.ts        # Reuses shared useHintSystem (game-agnostic)
│       │   └── hintConfig.ts           # Tokens per game, inactivity threshold
│       ├── state/
│       │   ├── useConnect4Store.ts     # Zustand store for local game state
│       │   └── connect4Reducer.ts      # Pure state transitions (dropDisc, undo, reset)
│       ├── online/
│       │   ├── connect4GameMappers.ts  # Firebase doc ↔ Connect4GameState serialization
│       │   └── connect4GameService.ts  # RTDB create/read/update for connect4 games
│       └── types.ts                    # All connect4-specific types (see Types section)
│
└── types/
    └── game.ts                         # Extended: add "connect4" to GameType union
```

### Extensibility rule

Re-affirms the rule from the Chess spec: every game gets its own `src/components/<game>/` and `src/lib/<game>/` subtree. Shared UI (Button, WinOverlay, SettingsPanel, GamePageShell) stays in shared folders.

---

## Types

```typescript
// src/lib/connect4/types.ts

export type PlayerId = 1 | 2;

export type CellValue = PlayerId | null;

// Board is stored column-major: board[col][row], row 0 = bottom, row 5 = top
export type Board = readonly (readonly CellValue[])[];

export interface Connect4Move {
  readonly col: number; // 0–6
  readonly row: number; // 0–5, resolved by gravity
  readonly player: PlayerId;
}

export interface WinResult {
  readonly winner: PlayerId;
  readonly cells: readonly [number, number][]; // [col, row] pairs of the 4 winning discs
}

export type Connect4Status = "idle" | "playing" | "finished" | "resigned" | "abandoned";

export interface Connect4GameState {
  readonly board: Board; // 7 columns × 6 rows
  readonly history: readonly Connect4Move[];
  readonly currentPlayer: PlayerId;
  readonly status: Connect4Status;
  readonly winResult: WinResult | null;
  readonly isDraw: boolean;
  readonly hoveredCol: number | null; // for column hover arrow
  readonly hintCol: number | null; // suggested column from AI hint
  readonly hintTokens: number;
  readonly animatingDisc: { col: number; fromRow: number; toRow: number } | null;
}

export interface Connect4Settings {
  readonly showLastMove: boolean; // subtle ring on last-placed disc
  readonly allowUndo: boolean;
  readonly hintsEnabled: boolean;
  readonly autoHintDelayMs: number; // 0 = disabled; default 30_000
  readonly animationSpeedMs: number; // per-row fall duration; default 60
}
```

---

## Visual Design

### Tokens

- **Player 1 disc**: fill `--na-cyan`, glow `--na-cyan` — goes first
- **Player 2 disc**: fill `--na-rose`, glow `--na-rose`
- **Empty cell**: dark circle, `--na-surface-2`, subtle inner shadow
- **Board frame**: `--na-surface-1`, rounded corners, neon border `--na-cyan` at 30% opacity
- **Hovered column** (current player): column background tints current player's color at 8%; hover arrow above the column pulses at 1Hz
- **Last-placed disc**: thin outer ring in player color, fades after 1.5s
- **Winning discs**: bright outer glow pulse, `filter: drop-shadow(0 0 14px var(--player-color))`, 2Hz indefinite until game reset
- **Non-winning discs after win**: desaturate to 40% opacity so winning line reads clearly
- **Falling disc animation**: disc appears at row 0 (top) of the column and translates down to its final row using CSS transform, duration = `animationSpeedMs × rowsTravelled`

### Board scaling

- Board uses a fixed 7×6 cell grid; cells are `min(11vw, 72px)` square
- Board is centered horizontally; `max-width: 560px` on desktop
- Column tap targets span the full column width and extend 44px above the top row to capture the hover arrow hit area
- On mobile (< 480px) column width is `calc(100vw / 7)` clamped to ≥ 44px

---

## Game State Management

### Pure rules engine (`rules.ts`)

The single source of truth. All mutations go through these pure functions.

```typescript
COLUMNS = 7
ROWS = 6

createInitialState(): Connect4GameState
isColumnFull(board: Board, col: number): boolean
listLegalColumns(board: Board): number[]
getDropRow(board: Board, col: number): number          // lowest empty row; -1 if full
dropDisc(state: Connect4GameState, col: number): Connect4GameState
checkWin(board: Board, col: number, row: number, player: PlayerId): WinResult | null
checkDraw(board: Board): boolean
```

`dropDisc` places the disc at `getDropRow`, then calls `checkWin` (only checks lines through the new cell per the rules reference), then `checkDraw`, and updates `status`, `winResult`, `isDraw`, `currentPlayer`, and `history`.

`checkWin` scans 4 directions (horizontal, vertical, diagonal ↗, diagonal ↘) up to 3 cells in each opposite ray and counts consecutive same-color discs. Returns `WinResult` with the 4 cell coords if ≥ 4 found.

### useConnect4Store.ts (Zustand)

Key actions:

```typescript
hoverColumn(col: number | null): void
dropDisc(col: number): void              // delegates to rules.dropDisc; triggers AI on next tick
undoMove(): void                         // solo: undo player + AI move pair; local: undo 1 move
requestHint(): void                      // deducts token, asks aiHard for best column
clearHint(): void
resetGame(): void
```

### connect4Reducer.ts

Pure `(state, action) => state`. No side effects. AI calls happen in the store layer (or a `useEffect` watching `currentPlayer`), not inside the reducer.

---

## AI Integration

### Architecture

```
Connect4GamePage
  └── useConnect4AI(state, difficulty) → { isThinking }
        └── runs ai.chooseColumn(state, difficulty) on next animation frame
              └── easy | medium | hard strategies
```

Hard AI on a 7×6 board (42 cells, branching factor up to 7) is offloaded to a Web Worker (`ai.worker.ts`) to keep the UI thread responsive during deep searches. Easy and Medium run inline.

### difficultyMap.ts

```typescript
export const DIFFICULTY_CONFIG = {
  easy: { strategy: "random", thinkMs: 400, maxDepth: 0 },
  medium: { strategy: "heuristic", thinkMs: 600, maxDepth: 4 },
  hard: { strategy: "minimax", thinkMs: 1000, maxDepth: 8 },
} as const;
```

`thinkMs` is a minimum display delay so AI moves don't feel instant.

### Strategy summaries

- **Easy** (`aiEasy.ts`): pick a uniformly random column from `listLegalColumns`.
- **Medium** (`aiMedium.ts`):
  1. If any column wins immediately for the AI, play it.
  2. If any column wins immediately for the opponent, block it.
  3. Otherwise, score columns by center proximity (col 3 = 6pts, cols 2&4 = 4pts, cols 1&5 = 2pts, cols 0&6 = 1pt) and pick the highest.
- **Hard** (`aiHard.ts`): minimax with alpha-beta pruning. Evaluation function = center-column occupancy bonus + threat count (3-in-a-row with open end) weighted by urgency. Move ordering: center columns first to improve alpha-beta cutoffs. Searches to `maxDepth`; at leaves uses the heuristic eval.

### Hint extraction

Hints always use the Hard AI logic regardless of selected difficulty. When `requestHint()` is called:

1. Run `aiHard.chooseColumn(state)` with depth capped at 6.
2. Store result as `hintCol` in state.
3. Deduct 1 hint token.
4. Highlight the column hover arrow in cyan pulse for `HINT_DISPLAY_MS` (3000ms), then `clearHint()`.

---

## Hint System

Reuses the cross-game `useHintSystem` hook. Game-specific config:

```typescript
// hintConfig.ts
export const HINT_TOKENS_PER_GAME = 3;
export const AUTO_HINT_INACTIVITY_MS = 30_000;
export const HINT_DISPLAY_MS = 3_000;
```

### Visual feedback

- `hintCol`: column drop arrow pulses cyan at 2Hz, column background tints cyan at 12%
- Framer Motion `AnimatePresence` wraps the highlight for smooth fade in/out
- Hint highlight renders above the normal hover layer

---

## Connect4Board Component

### Render layers (Z-order, bottom to top)

1. Board frame (background panel)
2. Empty cell circles
3. Placed discs (Player 1 cyan, Player 2 rose)
4. Last-placed disc ring (fades after 1.5s)
5. Column hover tint (8% player color)
6. Falling disc animation (absolutely positioned, translates down)
7. Win line highlight (glow on winning 4 cells)
8. Hint column highlight (pulsing cyan)
9. Column drop zones (invisible hit areas + hover arrows, always on top)

### Interaction model

- **Click / tap anywhere in a column**: drops a disc into that column (if not full and game is playing).
- **Hover (desktop)**: highlights the column and shows an animated arrow above it in the current player's color.
- **Column drop zone**: spans from above the top row (for the arrow) down through all 6 rows.
- **Disabled** while AI is thinking, while a disc is animating, or when `status ≠ "playing"`.
- **Full column**: drop zone click is a no-op; column arrow grays out and shows a "full" state.

### Board orientation

- Solo / local: Player 1 always shown on left of HUD; board has no orientation difference.
- Online: HUD reorders so the local user appears on the left.

---

## Connect4HUD Component

- Active-player chip pulses with their color, shows player name/nickname
- Hint token counter (3 icons, deactivate on use)
- "Thinking…" spinner overlaid on the board (not the HUD) while AI computes
- Undo button (visible in solo + local only when `allowUndo` is true)

---

## Online Multiplayer

### Firebase RTDB schema

```
/games/connect4/{gameId}
  status:        "waiting" | "active" | "finished" | "abandoned"
  gameType:      "connect4"
  board:         (1 | 2 | null)[][]   // [col][row], serialized 2D array
  history:       Connect4Move[]
  currentPlayer: 1 | 2
  winner:        1 | 2 | "draw" | null
  winCells:      [number, number][]   // [col, row] pairs, null if no winner yet
  player1:       { uid, nickname, queueEntryId? }
  player2:       { uid, nickname, queueEntryId? }
  lastMoveAt:    number               // server timestamp (ms)
  createdAt:     number
```

### Sync strategy

- Both clients subscribe via `onValue(ref(rtdb, /games/connect4/${gameId}))`.
- Only the active player writes. Security rules verify `auth.uid` matches the player whose turn it is.
- Each move patches `{ board, history, currentPlayer, winner, winCells, lastMoveAt }` atomically.
- Connection lost → existing `ConnectionLostBanner`.

### connect4GameService.ts

```typescript
createConnect4Game(player1: GameDocPlayer, player2?: GameDocPlayer): Promise<string>
joinConnect4Game(gameId: string, player: GameDocPlayer): Promise<void>
commitMove(gameId: string, move: Connect4Move, nextState: Connect4GameState): Promise<void>
subscribeConnect4Game(gameId: string, cb: (doc: Connect4OnlineDoc) => void): Unsubscribe
resignGame(gameId: string, resigningPlayer: PlayerId): Promise<void>
```

### Matchmaking

Reuse the existing queue service. Queue entries carry `gameType: "connect4"` so players only match within their game type.

---

## Settings Panel Extensions

Add a **Connect 4** section to the existing `SettingsPanel`:

| Toggle          | Default | Description                              |
| --------------- | ------- | ---------------------------------------- |
| Show last move  | ON      | Subtle ring on most recently placed disc |
| Allow Undo      | ON      | Enable undo button (solo + local only)   |
| Hints           | ON      | Enable hint system                       |
| Auto-hint delay | 30s     | Dropdown: Off / 15s / 30s / 60s          |
| Animation speed | Normal  | Dropdown: Off / Slow / Normal / Fast     |

Settings persist in `localStorage` under `neon-arena:connect4-settings`.

---

## Animation Strategy

All animations respect `prefers-reduced-motion` via the existing `useReducedMotion` hook.

### Disc fall (gravity animation)

- Disc appears at the top of the column (row 0 visually) and translates down to its final row.
- Duration = `animationSpeedMs × rowsTravelled` (default 60ms/row → max 300ms for 5-row fall).
- Easing: `cubic-bezier(0.55, 0, 1, 0.45)` — fast start, slight bounce at end.
- Board input is disabled for the duration of the animation.

### Disc placement

- On landing, a brief scale pulse: 1.0 → 1.12 → 1.0 (120ms, spring stiffness 300 damping 20).
- Last-placed ring fades in instantly and opacity-transitions to 0 over 1.5s.

### Win highlight

- Non-winning discs desaturate to 40% opacity (200ms ease-out).
- Winning 4 discs glow: `filter: drop-shadow(0 0 14px var(--player-color))` pulses 1.0 → 1.6 → 1.0 at 2Hz indefinitely.
- `WinOverlay` mounts (reuse existing) with winner info.
- Optional confetti via existing `tsparticles`, color-coded to winner.

### Column hover arrow

- Arrow slides down 4px and fades in (120ms) on column hover.
- Arrow color matches current player.
- Hint arrow additionally pulses at 2Hz in cyan.

### Reduced motion

- Disc fall: instant placement at final row, no translate animation.
- Landing pulse: disabled.
- Win glow: static (no pulse), just brighter opacity.
- No confetti.
- Hover arrow: appears/disappears instantly.

---

## Shared Abstractions Used

This game consumes (does not introduce) the cross-game abstractions established by the Chess spec:

1. `GameConfig` object — drives `ModeSelectPage`
2. `GamePageShell` — wraps particles, banner, settings, win overlay, route guards
3. `GameService<TDoc>` interface — implemented by `connect4GameService.ts`
4. `useGameSettings<T>` hook — for `Connect4Settings` persistence
5. Queue entry `gameType` field — `"connect4"`
6. `useHintSystem` hook — game-agnostic; plug `aiHard` in as `onRequestHint`

No new shared abstractions are introduced by this game.

---

## Dependencies to Add

None. This game uses only existing dependencies (React, Zustand, Framer Motion, Firebase, tsparticles). The AI is hand-written TypeScript. The Hard AI Web Worker uses Vite's native worker support (`new Worker(new URL(..., import.meta.url))`).

---

## Acceptance Criteria

| #   | Criterion                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------ |
| 1   | All 4 game modes (solo / local / online / friend) are playable end-to-end                              |
| 2   | Discs obey gravity: always fall to the lowest empty row in the chosen column                           |
| 3   | Dropping into a full column is a no-op; column is visually marked full                                 |
| 4   | Win is detected immediately after placement in all 4 directions (H, V, ↗, ↘)                           |
| 5   | Winning 4 discs are highlighted; all other discs desaturate                                            |
| 6   | Draw is declared when all 42 cells are filled with no winner                                           |
| 7   | Player 1 (cyan) always moves first; turns strictly alternate (no bonus turns)                          |
| 8   | Easy AI plays a random legal column; never plays into a full column                                    |
| 9   | Medium AI wins immediately if possible; blocks opponent's immediate win; otherwise plays center-biased |
| 10  | Hard AI returns a column within 1.5s on any board state; UI thread stays responsive (worker offload)   |
| 11  | Disc fall animation plays on every drop; board input locked during animation                           |
| 12  | Hint tokens: start at 3, decrement on use, button disabled at 0                                        |
| 13  | Auto-hint fires after inactivity threshold only on human's turn, never during AI thinking              |
| 14  | Hint highlights the suggested column for 3 seconds                                                     |
| 15  | Undo works in solo (reverts player + AI move pair) and local (reverts 1 move)                          |
| 16  | Online game stays in sync across two browser tabs within 300ms                                         |
| 17  | Column tap targets are ≥ 44px wide on touch devices; no missed taps on 375px viewport                  |
| 18  | All animations disable cleanly under `prefers-reduced-motion`                                          |
| 19  | Settings (toggles, animation speed) persist across page refresh via localStorage                       |
| 20  | Resigning works in all modes; opponent sees result immediately in online                               |
| 21  | `gameType: "connect4"` queue entries do not cross-match with other games                               |

---

## Out of Scope (v1)

- Variable board sizes (only 7×6 is supported)
- Time control / clocks
- Move list / history panel
- Spectator mode
- Chat during online game
- ELO / rating system
- Puzzle mode (forced-win training scenarios)
- Takeback requests in online mode (undo is local-only)
- Theming for player colors beyond cyan/rose
- Animated win line (line drawn through the 4 discs) — glow on cells is sufficient
