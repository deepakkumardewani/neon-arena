# Spec: NeonArena — Dots & Boxes

> **Status:** Ready for implementation
> **Last updated:** 2026-05-05
> **Parent spec:** `agent_docs/SPEC.md`
> **Rules reference:** `src/lib/game/rules/dots-and-boxes.md`

---

## Objective

Add Dots & Boxes as a first-class game in NeonArena. Same neon-cyberpunk aesthetic, same 4-mode structure (solo, local, online, friend), same routing shell, same Firebase backend. The game is simple to render but surprisingly deep strategically — the AI tier must reflect that (random → loony-avoidance → minimax with chain control).

### Who is the user?

- **Casual player** — wants a clean grid and a satisfying box-fill animation
- **Competitive player** — wants a Hard AI that plays the double-cross
- **Local pair** — pass-and-play on one device, color-coded turns
- **Online player** — matched against a random opponent via Firebase queue

### What does success look like?

- All 4 game modes are playable end-to-end
- AI responds in < 800ms on Easy/Medium, < 2s on Hard (5×5)
- Bonus-turn rule (chain turn) is visually unmistakable
- Board renders correctly on 375px mobile width with usable edge tap targets (≥ 24px hit area)
- First interaction latency (hover edge → highlight) < 50ms
- Online sync lag < 300ms on a good connection

---

## Routing

Mirror the TicTacToe / Chess routing pattern exactly:

```
/play/dots-and-boxes                    → ModeSelectPage       (shared, driven by gameConfig)
/play/dots-and-boxes/nickname           → NicknameEntryPage    (shared, pass gameType="dots-and-boxes")
/play/dots-and-boxes/matchmaking        → MatchmakingPage      (shared, pass gameType="dots-and-boxes")
/play/dots-and-boxes/game               → DotsAndBoxesGamePage (game-specific layout + logic)
/game/dots-and-boxes/:gameId            → DotsAndBoxesGamePage (online / friend — Firebase doc)
```

`ModeSelectPage`, `NicknameEntryPage`, and `MatchmakingPage` are shared across all games via the `GameConfig` abstraction established by Chess.

`DotsAndBoxesGamePage` is game-specific because the layout differs (no piece sidebar, no captured bar, no promotion modal — instead: score badges, turn indicator, board scaling logic for variable grid sizes).

---

## File & Folder Structure

All Dots & Boxes code lives under `src/` but is cleanly scoped. No Chess or TicTacToe files are modified except where shared types are extended.

```
src/
├── pages/
│   └── DotsAndBoxes/
│       └── GamePage.tsx                # Game-specific shell
│
├── components/
│   └── dotsAndBoxes/
│       ├── DotsBoard/
│       │   ├── index.tsx               # Grid layout, dot/edge/box rendering
│       │   ├── Dot.tsx                 # Single dot node
│       │   ├── Edge.tsx                # Horizontal or vertical edge with hover/claim states
│       │   └── Box.tsx                 # Filled box with owner color + initial
│       ├── ScoreBoard/
│       │   └── index.tsx               # Two-player score badges + turn indicator
│       ├── BoardSizePicker/
│       │   └── index.tsx               # 3×3 / 4×4 / 5×5 selector (solo + local pre-game)
│       └── DotsHUD/
│           └── index.tsx               # Hint token counter + active-player chip
│
├── lib/
│   └── dotsAndBoxes/
│       ├── engine/
│       │   ├── rules.ts                # Pure rules: edge claim, box completion, turn rule
│       │   ├── ai.ts                   # Difficulty router → easy/medium/hard strategies
│       │   ├── aiEasy.ts               # Random valid edge
│       │   ├── aiMedium.ts             # Greedy: complete boxes, avoid loony 3rd-sides
│       │   ├── aiHard.ts               # Minimax + chain analysis + double-cross
│       │   └── chainAnalysis.ts        # Chain detection, length, parity helpers
│       ├── hints/
│       │   ├── useHintSystem.ts        # Reuses shared useHintSystem (game-agnostic)
│       │   └── hintConfig.ts           # Tokens per game, inactivity threshold
│       ├── state/
│       │   ├── useDotsStore.ts         # Zustand store for local game state
│       │   └── dotsReducer.ts          # Pure state transitions (claimEdge, undo, reset)
│       ├── online/
│       │   ├── dotsGameMappers.ts      # Firebase doc ↔ DotsGameState serialization
│       │   └── dotsGameService.ts      # RTDB create/read/update for dots games
│       └── types.ts                    # All dots-specific types (see Types section)
│
└── types/
    └── game.ts                         # Extended: add "dots-and-boxes" to GameType union
```

### Extensibility rule

Re-affirms the rule from the Chess spec: every game gets its own `src/components/<game>/` and `src/lib/<game>/` subtree. Shared UI (Button, WinOverlay, SettingsPanel, GamePageShell) stays in shared folders.

---

## Types

```typescript
// src/lib/dotsAndBoxes/types.ts

export type PlayerId = 1 | 2;

export type EdgeOrientation = "horizontal" | "vertical";

export interface EdgeRef {
  readonly orientation: EdgeOrientation;
  readonly row: number; // 0-indexed
  readonly col: number; // 0-indexed
}

export interface DotsMove {
  readonly edge: EdgeRef;
  readonly player: PlayerId;
  readonly boxesClaimed: readonly BoxRef[]; // 0, 1, or 2
}

export interface BoxRef {
  readonly row: number;
  readonly col: number;
}

export type DotsStatus =
  | "idle"
  | "playing"
  | "finished" // all edges drawn
  | "resigned"
  | "abandoned";

export interface BoardSize {
  readonly rows: number; // box rows (N)
  readonly cols: number; // box cols (M)
}

export interface DotsGameState {
  readonly size: BoardSize;
  readonly horizontalEdges: readonly (readonly boolean[])[]; // [N+1][M]
  readonly verticalEdges: readonly (readonly boolean[])[]; // [N][M+1]
  readonly boxOwner: readonly (readonly (PlayerId | null)[])[]; // [N][M]
  readonly history: readonly DotsMove[];
  readonly currentPlayer: PlayerId;
  readonly scores: { readonly 1: number; readonly 2: number };
  readonly status: DotsStatus;
  readonly winner: PlayerId | "draw" | null;
  readonly hoveredEdge: EdgeRef | null;
  readonly hintEdge: EdgeRef | null;
  readonly hintTokens: number;
  readonly lastClaimedBoxes: readonly BoxRef[]; // for animation pulse
}

export interface DotsSettings {
  readonly defaultSize: BoardSize; // default 5×5
  readonly showLastMove: boolean; // highlight most recent edge
  readonly allowUndo: boolean;
  readonly hintsEnabled: boolean;
  readonly autoHintDelayMs: number; // 0 = disabled; default 30_000
}
```

---

## Visual Design

### Tokens

- **Player 1**: fill `--na-cyan`, glow `--na-cyan`
- **Player 2**: fill `--na-rose`, glow `--na-rose`
- **Dot**: filled `--na-fg`, 6px diameter on desktop, 8px on mobile
- **Undrawn edge**: 2px line, `--na-surface-2` at 30% opacity (faintly visible guide)
- **Hovered edge** (current player): 3px line, current player color at 60% with glow
- **Drawn edge**: 3px solid line, color of the player who drew it
- **Last move edge**: extra outer glow pulse for 600ms
- **Box (claimed)**: semi-transparent owner color fill with owner initial centered
- Neon glow on box claim using CSS `filter: drop-shadow(0 0 10px var(--glow-color))`

### Board scaling

- Board uses CSS `aspect-ratio: M / N` and fits inside `min(90vw, 600px)` container
- Edge hit areas are larger than the visible line (≥ 24px on touch) using transparent padding
- All sizes (3×3, 4×4, 5×5) render with the same dot diameter; spacing scales

---

## Game State Management

### Pure rules engine (`rules.ts`)

The single source of truth. All mutations go through these pure functions; the Zustand store is a thin wrapper.

```typescript
createInitialState(size: BoardSize): DotsGameState
isEdgeDrawn(state: DotsGameState, edge: EdgeRef): boolean
listLegalEdges(state: DotsGameState): EdgeRef[]
claimEdge(state: DotsGameState, edge: EdgeRef): DotsGameState  // applies turn rule
isBoxComplete(state: DotsGameState, box: BoxRef): boolean
isGameOver(state: DotsGameState): boolean
computeWinner(state: DotsGameState): PlayerId | "draw" | null
```

`claimEdge` enforces the bonus-turn rule (no `currentPlayer` switch when at least one box is claimed) and recomputes `status`, `winner`, `scores`, `boxOwner`, and appends to `history`.

### useDotsStore.ts (Zustand)

Key actions:

```typescript
hoverEdge(edge: EdgeRef | null): void
claimEdge(edge: EdgeRef): void              // delegates to rules.claimEdge
undoMove(): void                             // reverts last move (solo: revert through AI's bonus chain)
requestHint(): void                          // deducts token, asks aiHard for best move
clearHint(): void
resetGame(size?: BoardSize): void
```

### dotsReducer.ts

Pure `(state, action) => state`. No side effects. AI calls happen in the store layer (or in a `useEffect` watching `currentPlayer`), not inside the reducer.

---

## AI Integration

### Architecture

```
DotsAndBoxesGamePage
  └── useDotsAI(state, difficulty) → { isThinking }
        └── runs ai.chooseMove(state, difficulty) on next animation frame
              └── easy | medium | hard strategies
```

For Hard difficulty on 5×5 (60 edges), the search is offloaded to a Web Worker (`ai.worker.ts`) to keep the UI thread responsive. Easy and Medium run inline (cheap enough).

### difficultyMap.ts

```typescript
export const DIFFICULTY_CONFIG = {
  easy: { strategy: "random", thinkMs: 400, maxDepth: 0 },
  medium: { strategy: "greedy", thinkMs: 600, maxDepth: 2 },
  hard: { strategy: "minimax", thinkMs: 1200, maxDepth: 8 },
} as const;
```

`thinkMs` is a minimum display delay so AI moves don't feel instant.

### Strategy summaries

- **Easy** (`aiEasy.ts`): pick a uniformly random edge from `listLegalEdges`.
- **Medium** (`aiMedium.ts`):
  1. If any edge completes a box, play it (preferring 2-box completions).
  2. Otherwise, play any "safe" edge (does not give a box on next turn).
  3. If only loony moves remain, pick the one giving away the shortest chain.
- **Hard** (`aiHard.ts`): minimax with alpha-beta. Evaluation = `myScore - oppScore + chainParityBonus`. Move ordering: completing moves first, then safe moves, then sacrifices. Uses `chainAnalysis.ts` for double-cross decisions.

### Hint extraction

Hints reuse the Hard AI logic (always, regardless of selected difficulty). When `requestHint()` is called:

1. Run `aiHard.chooseMove(state)` with depth capped at 6 to keep latency low.
2. Store result as `hintEdge` in state.
3. Deduct 1 hint token.
4. Highlight edge for `HINT_DISPLAY_MS` (3000ms), then `clearHint()`.

---

## Hint System

Reuses the cross-game `useHintSystem` hook from the Chess spec. Game-specific config:

```typescript
// hintConfig.ts
export const HINT_TOKENS_PER_GAME = 3;
export const AUTO_HINT_INACTIVITY_MS = 30_000;
export const HINT_DISPLAY_MS = 3_000;
```

### Visual feedback

- `hintEdge`: pulsing cyan glow at 2Hz on the suggested edge
- Framer Motion `AnimatePresence` wraps the highlight for smooth fade in/out
- Hint highlight renders above the undrawn-edge guide layer but below the drawn-edge layer

---

## DotsBoard Component

### Render layers (Z-order, bottom to top)

1. Background grid (CSS gradient or SVG)
2. Box fills (claimed boxes, owner color)
3. Box-claim pulse animation (most recent claim)
4. Undrawn edge guides (faint)
5. Hover edge preview (current player color)
6. Drawn edges (solid, owner color)
7. Last-move highlight (outer glow)
8. Hint highlight (pulsing)
9. Dots (always on top)

### Interaction model

- **Click / tap**: claim an edge. The whole edge (including padded hit area) is the click target.
- **Hover (desktop only)**: shows a translucent preview of the edge in the current player's color.
- **No drag**: edges are atomic — clicks only.
- **Disabled while AI is thinking** or when game status ≠ `"playing"`.

### Board orientation

- Solo / local: Player 1 always on left/top of scoreboard, board has no orientation difference
- Online: scoreboard reorders so the local user appears on the left

---

## ScoreBoard Component

- Two large badges: `P1` and `P2` (or nicknames in online mode)
- Score number with a subtle count-up animation on change
- Active-player badge pulses with their color
- Bonus-turn indicator: when the active player just claimed a box, a small "+1 turn" tag fades in next to their badge for 1.2s

---

## Pre-game: Board Size Picker

For solo and local modes, before the first move:

- 3×3 / 4×4 / 5×5 selector (radio buttons, neon panel style)
- Default: 5×5
- Choice persists in `DotsSettings.defaultSize` via localStorage

For online and friend modes: size is fixed at 5×5 to keep matchmaking simple. (Friend mode v2 may allow custom sizes — out of scope for v1.)

---

## Online Multiplayer

### Firebase RTDB schema

```
/games/dots-and-boxes/{gameId}
  status: "waiting" | "active" | "finished" | "abandoned"
  gameType: "dots-and-boxes"
  size: { rows: number, cols: number }
  horizontalEdges: boolean[][]    // serialized 2D array
  verticalEdges:   boolean[][]
  boxOwner:        (1 | 2 | null)[][]
  history:         DotsMove[]     // serialized
  currentPlayer:   1 | 2
  scores:          { 1: number, 2: number }
  player1: { uid, nickname, queueEntryId? }
  player2: { uid, nickname, queueEntryId? }
  winner: 1 | 2 | "draw" | null
  lastMoveAt: number              // server timestamp (ms)
  createdAt: number
```

### Sync strategy

- Both clients subscribe to the game doc via `onValue(ref(rtdb, /games/dots-and-boxes/${gameId}))`.
- Only the active player writes. Bonus-turn rule means the same player may write multiple consecutive moves — this is fine; security rules check `auth.uid` matches the player whose turn it is.
- Each move patches `{ horizontalEdges | verticalEdges, boxOwner, currentPlayer, scores, history, lastMoveAt }` atomically.
- Connection lost → existing `ConnectionLostBanner`.

### dotsGameService.ts

```typescript
createDotsGame(player1: GameDocPlayer, player2?: GameDocPlayer, size?: BoardSize): Promise<string>
joinDotsGame(gameId: string, player: GameDocPlayer): Promise<void>
commitMove(gameId: string, move: DotsMove, nextState: DotsGameState): Promise<void>
subscribeDotsGame(gameId: string, cb: (doc: DotsOnlineDoc) => void): Unsubscribe
resignGame(gameId: string, resigningPlayer: PlayerId): Promise<void>
```

### Matchmaking

Reuse the existing queue service. Queue entries carry `gameType: "dots-and-boxes"` so players only match within their game type.

---

## Settings Panel Extensions

Add a **Dots & Boxes** section to the existing `SettingsPanel`:

| Toggle          | Default | Description                            |
| --------------- | ------- | -------------------------------------- |
| Default size    | 5×5     | Picker: 3×3 / 4×4 / 5×5 (solo + local) |
| Show last move  | ON      | Outer glow on most recent edge         |
| Allow Undo      | ON      | Enable undo button (solo + local only) |
| Hints           | ON      | Enable hint system                     |
| Auto-hint delay | 30s     | Dropdown: Off / 15s / 30s / 60s        |

Settings persist in `localStorage` under `neon-arena:dots-and-boxes-settings`.

---

## Animation Strategy

All animations respect `prefers-reduced-motion` via the existing `useReducedMotion` hook.

### Edge claim

- Drawn edge animates from one dot to the other (line draw, 180ms, ease-out)
- Stroke color is the claiming player's color
- Spring not needed — straight ease-out feels crisp

### Box claim

- Box fill scales from 0.6 → 1.0 with opacity 0 → 1 (220ms, spring stiffness 280 damping 24)
- Owner initial fades in 80ms after fill begins
- Outer glow pulse on the box for 600ms (CSS keyframes)

### Bonus-turn indicator

- "+1 turn" tag slides in from the active player's badge (180ms), holds 800ms, fades out (200ms)

### Game over

- All unclaimed boxes (if any) fade to 20% opacity
- `WinOverlay` mounts (reuse existing) with winner info + final score
- Optional confetti via existing `tsparticles` setup, color-coded to winner

### Hint highlight

- Pulsing cyan glow on suggested edge, 2Hz, scales 1.0 → 1.15 → 1.0
- Fade in 200ms, hold for `HINT_DISPLAY_MS`, fade out 200ms

### Reduced motion

- All transitions become instant state changes
- Box claim: opacity snap, no scale
- Edge: instant stroke
- No pulse, no confetti

---

## Shared Abstractions Used

This game consumes (does not introduce) the cross-game abstractions established by the Chess spec:

1. `GameConfig` object — drives `ModeSelectPage`
2. `GamePageShell` — wraps particles, banner, settings, win overlay, route guards
3. `GameService<TDoc>` interface — implemented by `dotsGameService.ts`
4. `useGameSettings<T>` hook — for `DotsSettings` persistence
5. Queue entry `gameType` field — `"dots-and-boxes"`
6. `useHintSystem` hook — game-agnostic; plug `aiHard` in as `onRequestHint`

No new shared abstractions are introduced by this game.

---

## Dependencies to Add

None. This game uses only existing dependencies (React, Zustand, Framer Motion, Firebase, tsparticles). The AI is hand-written TypeScript — no `chess.js`/Stockfish equivalent needed.

If the Hard AI is offloaded to a Web Worker, no new package is required (Vite supports `new Worker(new URL(..., import.meta.url))` natively).

---

## Acceptance Criteria

| #   | Criterion                                                                                       |
| --- | ----------------------------------------------------------------------------------------------- |
| 1   | All 4 game modes (solo / local / online / friend) are playable end-to-end                       |
| 2   | All 3 board sizes (3×3, 4×4, 5×5) render correctly and are playable in solo + local             |
| 3   | Bonus-turn rule works: completing a box keeps the same player's turn                            |
| 4   | Two-box completion in a single move scores 2 points and grants a bonus turn                     |
| 5   | Easy AI plays random legal edges; Medium AI completes boxes and avoids loony 3rd-sides          |
| 6   | Hard AI demonstrably uses double-cross strategy (verifiable on a small contrived endgame)       |
| 7   | Hard AI on 5×5 returns a move within 2s; UI thread stays responsive (worker offload)            |
| 8   | Game ends when all edges are drawn; winner / draw computed correctly                            |
| 9   | Hint tokens: start at 3, decrement on use, button disabled at 0                                 |
| 10  | Auto-hint fires after inactivity threshold only on human's turn, never during AI thinking       |
| 11  | Hint highlights the suggested edge for 3 seconds                                                |
| 12  | Undo works in solo (reverts through AI's full bonus chain back to player) and local (reverts 1) |
| 13  | Online game stays in sync across two browser tabs within 300ms                                  |
| 14  | Edge tap targets are ≥ 24px on touch devices; no missed taps on 375px viewport                  |
| 15  | All animations disable cleanly under `prefers-reduced-motion`                                   |
| 16  | Settings (default size, toggles) persist across page refresh via localStorage                   |
| 17  | Resigning works in all modes; opponent sees result immediately in online                        |
| 18  | `gameType: "dots-and-boxes"` queue entries do not cross-match with other games                  |

---

## Out of Scope (v1)

- Custom board sizes in online / friend mode (fixed at 5×5)
- Non-square boards beyond the three presets
- Time control / clocks
- Move list export
- Spectator mode
- Chat during online game
- ELO / rating system
- Puzzle mode (forced-chain training scenarios)
- Takeback requests in online mode (undo is local-only)
- Theming for player colors beyond cyan/rose
