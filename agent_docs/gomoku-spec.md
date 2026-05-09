# Spec: NeonArena — Gomoku (Five in a Row)

> **Status:** Ready for implementation
> **Last updated:** 2026-05-07
> **Parent spec:** `agent_docs/SPEC.md`
> **Rules reference:** `src/lib/game/rules/gomoku.md`

---

## Objective

Add Gomoku as a first-class game in NeonArena. Same neon-cyberpunk aesthetic, same 4-mode structure (solo, local, online, friend), same routing shell, same Firebase backend. The game is simple to learn but deep to master — the AI tier must reflect that progression (random → greedy pattern-matching → threat-space search with alpha-beta).

### Who is the user?

- **Casual player** — wants a clean grid and satisfying stone placement with glow effects
- **Competitive player** — wants a Hard AI that plays genuine threats and counter-threats
- **Local pair** — pass-and-play on one device, Black vs White color scheme
- **Online player** — matched against a random opponent via Firebase queue

### What does success look like?

- All 4 game modes are playable end-to-end
- AI responds in < 800ms on Easy/Medium, < 2s on Hard (15×15 with threat-space search)
- Win detection is instant and visually unmistakable (5-in-a-row highlight)
- Board renders correctly on 375px mobile width with usable intersection tap targets (≥ 24px hit area)
- First interaction latency (hover intersection → preview) < 50ms
- Online sync lag < 300ms on a good connection

---

## Routing

Mirror the TicTacToe / Chess / Dots & Boxes routing pattern exactly:

```
/play/gomoku                    → ModeSelectPage       (shared, driven by gameConfig)
/play/gomoku/nickname           → NicknameEntryPage    (shared, pass gameType="gomoku")
/play/gomoku/matchmaking        → MatchmakingPage      (shared, pass gameType="gomoku")
/play/gomoku/game               → GomokuGamePage       (game-specific layout + logic)
/game/gomoku/:gameId            → GomokuGamePage       (online / friend — Firebase doc)
```

`ModeSelectPage`, `NicknameEntryPage`, and `MatchmakingPage` are shared across all games via the `GameConfig` abstraction established by Chess.

`GomokuGamePage` is game-specific because the layout differs (intersection-based board, no piece sidebar, last-move indicator dot, win-line highlight overlay).

---

## File & Folder Structure

All Gomoku code lives under `src/` but is cleanly scoped. No Chess, TicTacToe, or Dots & Boxes files are modified except where shared types are extended.

```
src/
├── pages/
│   └── Gomoku/
│       └── GamePage.tsx                # Game-specific shell
│
├── components/
│   └── gomoku/
│       ├── GomokuBoard/
│       │   ├── index.tsx               # Grid layout, intersection rendering
│       │   ├── Intersection.tsx        # Single intersection with hover/stone states
│       │   ├── Stone.tsx               # Black or White stone with glow effect
│       │   └── WinLine.tsx             # Animated highlight over the 5-in-a-row
│       ├── GomokuHUD/
│       │   └── index.tsx               # Turn indicator, move count, hint tokens
│       └── BoardSizePicker/
│           └── index.tsx               # 9×9 / 13×13 / 15×15 selector (solo + local)
│
├── lib/
│   └── gomoku/
│       ├── engine/
│       │   ├── rules.ts                # Pure rules: place stone, win detection, draw
│       │   ├── ai.ts                   # Difficulty router → easy/medium/hard strategies
│       │   ├── aiEasy.ts               # Random valid intersection
│       │   ├── aiMedium.ts             # Greedy: pattern score, block open-fours
│       │   ├── aiHard.ts               # Threat-space search with alpha-beta pruning
│       │   └── patternScore.ts         # Heuristic weights for stone patterns
│       ├── hints/
│       │   ├── useHintSystem.ts        # Reuses shared useHintSystem (game-agnostic)
│       │   └── hintConfig.ts           # Tokens per game, inactivity threshold
│       ├── state/
│       │   ├── useGomokuStore.ts       # Zustand store for local game state
│       │   └── gomokuReducer.ts        # Pure state transitions (placeStone, undo, reset)
│       ├── online/
│       │   ├── gomokuGameMappers.ts    # Firebase doc ↔ GomokuGameState serialization
│       │   └── gomokuGameService.ts    # RTDB create/read/update for gomoku games
│       └── types.ts                    # All gomoku-specific types (see Types section)
│
└── types/
    └── game.ts                         # Extended: add "gomoku" to GameType union
```

### Extensibility rule

Re-affirms the rule from the Chess spec: every game gets its own `src/components/<game>/` and `src/lib/<game>/` subtree. Shared UI (Button, WinOverlay, SettingsPanel, GamePageShell) stays in shared folders.

---

## Types

```typescript
// src/lib/gomoku/types.ts

export type StoneColor = "black" | "white";

export interface GomokuCell {
  readonly row: number; // 0-indexed
  readonly col: number; // 0-indexed
}

export interface GomokuMove {
  readonly cell: GomokuCell;
  readonly color: StoneColor;
  readonly moveNumber: number;
}

export interface WinLine {
  readonly cells: readonly GomokuCell[]; // exactly 5+ cells forming the winning run
  readonly direction: "horizontal" | "vertical" | "diagonal-asc" | "diagonal-desc";
}

export type GomokuStatus = "idle" | "playing" | "finished" | "resigned" | "abandoned";

export type BoardSize = 9 | 13 | 15;

export interface GomokuGameState {
  readonly boardSize: BoardSize;
  readonly board: readonly (readonly (StoneColor | null)[])[];
  readonly history: readonly GomokuMove[];
  readonly currentColor: StoneColor;
  readonly status: GomokuStatus;
  readonly winner: StoneColor | "draw" | null;
  readonly winLine: WinLine | null;
  readonly hoveredCell: GomokuCell | null;
  readonly lastMove: GomokuCell | null;
  readonly hintCell: GomokuCell | null;
  readonly hintTokens: number;
}

export interface GomokuSettings {
  readonly defaultBoardSize: BoardSize; // default 15
  readonly showLastMove: boolean; // highlight most recent stone with center dot
  readonly showCoordinates: boolean; // A–O column labels, 1–15 row labels
  readonly allowUndo: boolean;
  readonly hintsEnabled: boolean;
  readonly autoHintDelayMs: number; // 0 = disabled; default 30_000
}
```

---

## Visual Design

### Tokens

- **Black stone**: radial gradient `#1a1a1a → #000`, glow `--na-fg` at low opacity, inner highlight dot
- **White stone**: radial gradient `#e8e8e8 → #bbb`, glow `white` at low opacity, inner highlight dot
- **Board grid**: warm tan (`#c8a96e`) lines on dark background — classic Gomoku wood feel reimagined in neon; alternatively use `--na-surface-2` lines with subtle grid glow
- **Empty intersection**: invisible; hover shows a translucent ghost stone in current player's color (40% opacity)
- **Last-move indicator**: small cyan dot at the center of the most recently placed stone
- **Win line**: animated neon highlight (player color) connecting the 5-in-a-row cells, 600ms draw-on animation
- **Star points**: small filled circles at standard board positions (15×15: center + 4 corner star points at row/col 3 and 11)

### Board scaling

- Board uses CSS `aspect-ratio: 1 / 1` and fits inside `min(90vw, 600px)` container
- Intersection hit areas extend beyond the visible dot (≥ 24px on touch) using transparent padding per cell
- All board sizes (9×9, 13×13, 15×15) render with the same stone diameter relative to cell size; spacing scales

### Coordinate labels (optional)

- Column labels A–O along the top and bottom edges
- Row labels 1–15 along the left and right edges
- Rendered as small `--na-muted` text, hidden on very small viewports (< 375px)

---

## Game State Management

### Pure rules engine (`rules.ts`)

The single source of truth. All mutations go through these pure functions; the Zustand store is a thin wrapper.

```typescript
createInitialState(size: BoardSize): GomokuGameState
isLegalMove(state: GomokuGameState, cell: GomokuCell): boolean
listLegalMoves(state: GomokuGameState): GomokuCell[]
placeStone(state: GomokuGameState, cell: GomokuCell): GomokuGameState
detectWin(board: Board, lastCell: GomokuCell, color: StoneColor): WinLine | null
isGameOver(state: GomokuGameState): boolean
```

`detectWin` scans only through `lastCell` in all four directions — no full-board scan needed. It returns the winning `WinLine` (or `null`) so the UI can highlight it.

`placeStone` updates `board`, appends to `history`, switches `currentColor`, then calls `detectWin` and `isGameOver` to update `status` and `winner`.

### useGomokuStore.ts (Zustand)

Key actions:

```typescript
hoverCell(cell: GomokuCell | null): void
placeStone(cell: GomokuCell): void          // delegates to rules.placeStone
undoMove(): void                             // reverts last move (solo: reverts through AI's move too)
requestHint(): void                          // deducts token, asks aiHard for best cell
clearHint(): void
resetGame(size?: BoardSize): void
```

### gomokuReducer.ts

Pure `(state, action) => state`. No side effects. AI calls happen in the store layer (or in a `useEffect` watching `currentColor`), not inside the reducer.

---

## AI Integration

### Architecture

```
GomokuGamePage
  └── useGomokuAI(state, difficulty) → { isThinking }
        └── runs ai.chooseMove(state, difficulty) on next animation frame
              └── easy | medium | hard strategies
```

For Hard difficulty on 15×15, the search uses threat-space search and is offloaded to a Web Worker (`ai.worker.ts`) to keep the UI thread responsive. Easy and Medium run inline.

### difficultyConfig

```typescript
export const DIFFICULTY_CONFIG = {
  easy: { strategy: "random", thinkMs: 400, maxDepth: 0 },
  medium: { strategy: "greedy-pattern", thinkMs: 600, maxDepth: 2 },
  hard: { strategy: "threat-space", thinkMs: 1200, maxDepth: 6 },
} as const;
```

`thinkMs` is a minimum display delay so AI moves don't feel instant.

### Strategy summaries

- **Easy** (`aiEasy.ts`): pick a uniformly random cell from `listLegalMoves`. Restrict candidates to within 2 cells of any existing stone (empty board → play near center).

- **Medium** (`aiMedium.ts`):
  1. If any move wins immediately, play it.
  2. If opponent has an open-four (one move from winning), block it.
  3. Score all candidate cells using `patternScore` heuristic; pick highest.
  4. Candidate window: intersections within 2 steps of any placed stone.

- **Hard** (`aiHard.ts`): threat-space search — enumerate forced sequences from critical threats (fours, threes), prune non-threatening branches, alpha-beta on the resulting reduced tree. Evaluation uses `patternScore` weights. Move candidates are restricted to a window around existing stones (never exhausts the full 225-cell board). Falls back to pattern-score pick when no threats exist.

### patternScore.ts — heuristic weights

```typescript
export const PATTERN_WEIGHTS = {
  five: Infinity, // immediate win
  openFour: 10_000, // one move from unblockable win
  blockedFour: 1_000,
  openThree: 500,
  blockedThree: 100,
  openTwo: 50,
  blockedTwo: 10,
} as const;
```

Scores are computed for both colors; AI maximizes `ownScore - oppScore`.

### Hint extraction

Hints reuse the Hard AI logic (always, regardless of selected difficulty). When `requestHint()` is called:

1. Run `aiHard.chooseMove(state)` with depth capped at 4 to keep latency low.
2. Store result as `hintCell` in state.
3. Deduct 1 hint token.
4. Highlight intersection for `HINT_DISPLAY_MS` (3000ms), then `clearHint()`.

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

- `hintCell`: pulsing cyan glow at 2Hz on the suggested intersection (ghost stone outline)
- Framer Motion `AnimatePresence` wraps the highlight for smooth fade in/out
- Hint highlight renders above the ghost-hover layer but below placed stones

---

## GomokuBoard Component

### Render layers (Z-order, bottom to top)

1. Board background (grid lines + star points)
2. Coordinate labels (optional, outermost ring)
3. Ghost stone hover preview (current player color, 40% opacity)
4. Hint highlight (pulsing ghost outline)
5. Placed stones (Black / White with glow)
6. Last-move indicator dot (center dot on most recent stone)
7. Win line overlay (animated neon line through 5-in-a-row)

### Interaction model

- **Click / tap**: place a stone on an empty intersection.
- **Hover (desktop only)**: shows a translucent ghost stone in the current player's color.
- **No drag**: stones are placed atomically — clicks only.
- **Disabled while AI is thinking** or when game status ≠ `"playing"`.

### Board orientation

- Solo / local: Black always listed first in the HUD; board has no orientation flip
- Online: HUD reorders so the local player appears on top/left

---

## GomokuHUD Component

- Turn indicator chip showing current player color (Black / White) and name/nickname
- Move counter ("Move 14")
- Hint token display (3 / 3 → 2 / 3 → … → disabled at 0)
- Undo button (solo + local only)
- Optional coordinate toggle button

---

## Pre-game: Board Size Picker

For solo and local modes, before the first move:

- 9×9 / 13×13 / 15×15 selector (radio buttons, neon panel style)
- Default: 15×15
- Choice persists in `GomokuSettings.defaultBoardSize` via localStorage

For online and friend modes: size is fixed at 15×15 to keep matchmaking simple.

---

## Online Multiplayer

### Firebase RTDB schema

```
/games/gomoku/{gameId}
  status: "waiting" | "active" | "finished" | "abandoned"
  gameType: "gomoku"
  boardSize: 9 | 13 | 15
  board: (StoneColor | null)[][]    // serialized 2D array
  history: GomokuMove[]
  currentColor: "black" | "white"
  playerBlack: { uid, nickname, queueEntryId? }
  playerWhite: { uid, nickname, queueEntryId? }
  winner: "black" | "white" | "draw" | null
  winLine: WinLine | null
  lastMoveAt: number                // server timestamp (ms)
  createdAt: number
```

### Sync strategy

- Both clients subscribe via `onValue(ref(rtdb, /games/gomoku/${gameId}))`.
- Only the active player writes. Security rules check `auth.uid` matches the player whose color matches `currentColor`.
- Each move patches `{ board, currentColor, history, winner, winLine, lastMoveAt }` atomically.
- Connection lost → existing `ConnectionLostBanner`.

### gomokuGameService.ts

```typescript
createGomokuGame(playerBlack: GameDocPlayer, playerWhite?: GameDocPlayer, size?: BoardSize): Promise<string>
joinGomokuGame(gameId: string, player: GameDocPlayer): Promise<void>
commitMove(gameId: string, move: GomokuMove, nextState: GomokuGameState): Promise<void>
subscribeGomokuGame(gameId: string, cb: (doc: GomokuOnlineDoc) => void): Unsubscribe
resignGame(gameId: string, resigningColor: StoneColor): Promise<void>
```

### Matchmaking

Reuse the existing queue service. Queue entries carry `gameType: "gomoku"` so players only match within their game type. Color assignment (Black / White) is determined by queue arrival order.

---

## Settings Panel Extensions

Add a **Gomoku** section to the existing `SettingsPanel`:

| Toggle             | Default | Description                                |
| ------------------ | ------- | ------------------------------------------ |
| Default board size | 15×15   | Picker: 9×9 / 13×13 / 15×15 (solo + local) |
| Show last move     | ON      | Center dot on most recent stone            |
| Show coordinates   | ON      | A–O / 1–15 labels on board edges           |
| Allow Undo         | ON      | Enable undo button (solo + local only)     |
| Hints              | ON      | Enable hint system                         |
| Auto-hint delay    | 30s     | Dropdown: Off / 15s / 30s / 60s            |

Settings persist in `localStorage` under `neon-arena:gomoku-settings`.

---

## Animation Strategy

All animations respect `prefers-reduced-motion` via the existing `useReducedMotion` hook.

### Stone placement

- Stone scales from 0.6 → 1.0 with opacity 0 → 1 (180ms, spring stiffness 300 damping 26)
- Subtle outer glow pulse on placement for 400ms (CSS keyframes)

### Win line

- Neon line draws on from the first winning stone to the last (400ms, ease-out)
- Line color matches the winner's stone color with strong glow (`filter: drop-shadow`)
- Winning stones pulse at 1.5Hz for 1.5s after the line draws

### Last-move indicator

- Small center dot fades in 120ms on the most recently placed stone
- Moves to new stone on each turn (previous dot fades out)

### Game over

- All non-winning stones drop to 40% opacity
- `WinOverlay` mounts (reuse existing) with winner info
- Optional confetti via existing `tsparticles` setup, color-coded to winner (black/white particles + accent)

### Hint highlight

- Pulsing ghost-stone outline at the suggested intersection, 2Hz, opacity 0.4 → 0.9 → 0.4
- Fade in 200ms, hold for `HINT_DISPLAY_MS`, fade out 200ms

### Reduced motion

- Stone placement: instant opacity snap, no scale
- Win line: instant full stroke appearance, no draw-on
- No pulse, no confetti

---

## Shared Abstractions Used

This game consumes (does not introduce) the cross-game abstractions established by the Chess spec:

1. `GameConfig` object — drives `ModeSelectPage`
2. `GamePageShell` — wraps particles, banner, settings, win overlay, route guards
3. `GameService<TDoc>` interface — implemented by `gomokuGameService.ts`
4. `useGameSettings<T>` hook — for `GomokuSettings` persistence
5. Queue entry `gameType` field — `"gomoku"`
6. `useHintSystem` hook — game-agnostic; plug `aiHard` in as `onRequestHint`

No new shared abstractions are introduced by this game.

---

## Dependencies to Add

None. This game uses only existing dependencies (React, Zustand, Framer Motion, Firebase, tsparticles). The AI is hand-written TypeScript with no external engine.

If the Hard AI is offloaded to a Web Worker, no new package is required (Vite supports `new Worker(new URL(..., import.meta.url))` natively).

---

## Acceptance Criteria

| #   | Criterion                                                                                   |
| --- | ------------------------------------------------------------------------------------------- |
| 1   | All 4 game modes (solo / local / online / friend) are playable end-to-end                   |
| 2   | All 3 board sizes (9×9, 13×13, 15×15) render correctly and are playable in solo + local     |
| 3   | Black plays first; color assignment is correct in all modes                                 |
| 4   | Win detection correctly identifies 5-or-more in a row in all 4 directions                   |
| 5   | Win line animates over the 5-in-a-row after the game ends                                   |
| 6   | Draw is declared when the board is full and no winner exists                                |
| 7   | Easy AI plays random legal moves near existing stones                                       |
| 8   | Medium AI blocks opponent's open-fours and plays its own open-fours                         |
| 9   | Hard AI demonstrably plays threat sequences (verifiable on a contrived four-in-a-row setup) |
| 10  | Hard AI on 15×15 returns a move within 2s; UI thread stays responsive (worker offload)      |
| 11  | Hint tokens: start at 3, decrement on use, button disabled at 0                             |
| 12  | Auto-hint fires after inactivity threshold only on human's turn, never during AI thinking   |
| 13  | Hint highlights the suggested intersection for 3 seconds                                    |
| 14  | Undo works in solo (reverts AI move + player move together) and local (reverts 1 move)      |
| 15  | Online game stays in sync across two browser tabs within 300ms                              |
| 16  | Intersection tap targets are ≥ 24px on touch devices; no missed taps on 375px viewport      |
| 17  | All animations disable cleanly under `prefers-reduced-motion`                               |
| 18  | Settings (default board size, toggles) persist across page refresh via localStorage         |
| 19  | Resigning works in all modes; opponent sees result immediately in online                    |
| 20  | `gameType: "gomoku"` queue entries do not cross-match with other games                      |
| 21  | Coordinate labels render correctly and can be toggled on/off via settings                   |
| 22  | Star points render at the correct intersections for each board size                         |

---

## Out of Scope (v1)

- Pro rule (Black's first stone must be center)
- Swap rule (White may swap colors after Black's first stone)
- Renju / Three-and-three prohibition rules
- Exact-five (standard) variant — Neon Arena uses freestyle only
- Custom board sizes beyond the three presets
- 19×19 board (tournament size)
- Time control / clocks
- Move list export / SGF format
- Spectator mode
- Chat during online game
- ELO / rating system
- Puzzle mode (forced-threat training scenarios)
- Takeback requests in online mode (undo is local-only)
- Opening book for Hard AI
