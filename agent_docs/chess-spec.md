# Spec: NeonArena — Chess Game

> **Status:** Ready for implementation
> **Last updated:** 2026-05-01
> **Parent spec:** `agent_docs/SPEC.md`

---

## Objective

Add Chess as the second game in NeonArena. It must feel like a first-class citizen of the portal — same neon-cyberpunk aesthetic, same 4-mode structure (solo, local, online, friend), same routing shell, same Firebase backend. Chess is the most complex game in the roadmap; its architecture sets the pattern for every future game.

### Who is the user?

- **Casual player** — knows basic chess, wants a cool-looking board, may need hints
- **Competitive player** — wants strong AI, no hand-holding, tracks W/L/D
- **Local pair** — pass-and-play on one device
- **Online player** — matched against a random opponent via Firebase queue

### What does success look like?

- All 4 game modes are playable end-to-end
- Stockfish AI responds in < 1.5s on difficulty Easy/Medium, < 3s on Hard
- Hint tokens provide a meaningful but limited crutch (not a cheat code)
- Board renders correctly on 375px mobile width
- First move latency (piece pick → legal moves highlight) < 50ms
- Online sync lag < 300ms on a good connection

---

## Routing

Mirror the TicTacToe routing pattern exactly:

```
/play/chess                    → ModeSelectPage       (shared, driven by gameConfig)
/play/chess/nickname           → NicknameEntryPage    (shared, pass gameType="chess")
/play/chess/matchmaking        → MatchmakingPage      (shared, pass gameType="chess")
/play/chess/game               → ChessGamePage        (chess-specific layout + logic)
/game/chess/:gameId            → ChessGamePage        (online / friend — Firebase doc)
```

`ModeSelectPage`, `NicknameEntryPage`, and `MatchmakingPage` are **shared across all games**. They accept a `gameConfig` object (title, description, route prefix, available modes) so every future game gets the same shell for free without a new page file.

`ChessGamePage` is chess-specific because the layout is fundamentally different from TicTacToe: it has a sidebar (move history), two captured-pieces bars, a different HUD, and a promotion modal. There is no meaningful shared abstraction between a TicTacToe board and a chess board at the page level.

---

## File & Folder Structure

All chess code lives under `src/` but is cleanly scoped. No TicTacToe files are modified except where shared types are extended.

```
src/
├── pages/
│   ├── ModeSelect/
│   │   └── index.tsx                  # MODIFIED: now accepts gameConfig prop; shared by all games
│   └── Chess/
│       └── GamePage.tsx               # Chess-specific game shell
│
├── components/
│   └── chess/
│       ├── ChessBoard/
│       │   ├── index.tsx              # 8×8 board, square rendering, drag/click handling
│       │   ├── Square.tsx             # Individual square with highlight states
│       │   └── BoardLabels.tsx        # Rank/file labels (a–h, 1–8)
│       ├── ChessPiece/
│       │   ├── index.tsx              # Piece router → correct SVG by type+color
│       │   ├── pieces/
│       │   │   ├── King.tsx
│       │   │   ├── Queen.tsx
│       │   │   ├── Rook.tsx
│       │   │   ├── Bishop.tsx
│       │   │   ├── Knight.tsx
│       │   │   └── Pawn.tsx
│       │   └── pieceTheme.ts          # Color tokens for white/black piece fills
│       ├── PromotionModal/
│       │   └── index.tsx              # Piece picker overlay on pawn promotion
│       ├── MoveHistoryPanel/
│       │   └── index.tsx              # Algebraic notation sidebar
│       ├── CapturedPiecesBar/
│       │   └── index.tsx              # Captured pieces + material advantage
│       └── ChessHUD/
│           └── index.tsx              # Hint token counter + player info
│
├── lib/
│   └── chess/
│       ├── engine/
│       │   ├── stockfish.worker.ts    # Web Worker wrapping Stockfish.wasm
│       │   ├── useStockfish.ts        # Hook: send position, receive best move
│       │   └── difficultyMap.ts       # Difficulty → Stockfish skill level + depth
│       ├── hints/
│       │   ├── useHintSystem.ts       # Token economy, timer, visual state
│       │   └── hintConfig.ts          # Tokens per game, inactivity threshold
│       ├── state/
│       │   ├── useChessStore.ts       # Zustand store for local chess state
│       │   └── chessReducer.ts        # Pure state transitions (move, undo, promote)
│       ├── online/
│       │   ├── chessGameMappers.ts    # Firebase doc ↔ ChessGameState serialization
│       │   └── chessGameService.ts    # RTDB create/read/update for chess games
│       └── types.ts                   # All chess-specific types (see Types section)
│
└── types/
    └── game.ts                        # Extended: add "chess" to GameType union
```

### Extensibility rule

Every future game (Connect4, Gomoku, etc.) gets its own `src/components/<game>/` and `src/lib/<game>/` subtree. No game logic leaks into shared folders. Shared UI (Button, WinOverlay, SettingsPanel) stays in `src/components/` root.

---

## Types

```typescript
// src/lib/chess/types.ts

export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
export type PieceColor = "white" | "black";

export interface ChessPiece {
  readonly type: PieceType;
  readonly color: PieceColor;
}

/** Square index 0–63, a1=0, h8=63 (little-endian rank). */
export type SquareIndex = number;

export interface ChessMove {
  readonly from: SquareIndex;
  readonly to: SquareIndex;
  readonly promotion?: PieceType; // only set for pawn promotions
  readonly san: string; // Standard Algebraic Notation e.g. "Nf3"
  readonly captured?: PieceType;
}

export type ChessStatus =
  | "idle"
  | "playing"
  | "check" // king in check, game continues
  | "checkmate" // game over — current player loses
  | "stalemate" // game over — draw
  | "draw" // draw by rule (repetition, 50-move, insufficient material)
  | "resigned"
  | "abandoned";

export type PromotionPending = {
  readonly from: SquareIndex;
  readonly to: SquareIndex;
} | null;

export interface ChessGameState {
  readonly fen: string; // current board as FEN string
  readonly history: readonly ChessMove[]; // full move list
  readonly capturedByWhite: readonly PieceType[];
  readonly capturedByBlack: readonly PieceType[];
  readonly status: ChessStatus;
  readonly activeColor: PieceColor;
  readonly promotionPending: PromotionPending;
  readonly selectedSquare: SquareIndex | null;
  readonly legalMoves: readonly SquareIndex[]; // targets for selectedSquare
  readonly hintFrom: SquareIndex | null;
  readonly hintTo: SquareIndex | null;
  readonly hintTokens: number;
}

// Extended game settings
export interface ChessSettings {
  readonly showMoveHistory: boolean;
  readonly showCapturedPieces: boolean;
  readonly allowUndo: boolean;
  readonly hintsEnabled: boolean;
  readonly autoHintDelayMs: number; // 0 = disabled; default 30_000
}
```

---

## Chess Piece SVG Components

### Design direction

- Pieces use **flat geometric SVG** inspired by circuit/cyberpunk motifs — angular silhouettes, not traditional Staunton
- **White pieces**: filled with `--na-fg` (near-white), stroke `--na-cyan`
- **Black pieces**: filled with `--na-surface-2`, stroke `--na-rose`
- Each piece accepts `size?: number` (default 40) and `color: PieceColor`
- Neon glow on hover and when selected via CSS `filter: drop-shadow(0 0 6px var(--glow-color))`

### pieceTheme.ts

```typescript
export const PIECE_COLORS = {
  white: { fill: "var(--na-fg)", stroke: "var(--na-cyan)" },
  black: { fill: "var(--na-surface-2)", stroke: "var(--na-rose)" },
} as const;
```

### ChessPiece index.tsx

Routes to the correct SVG component by `type`:

```typescript
interface Props {
  piece: ChessPiece;
  size?: number;
  className?: string;
}
```

### SVG authoring rules

- Each piece SVG is a single `<svg>` with `viewBox="0 0 40 40"`
- Paths use `fill` and `stroke` from `PIECE_COLORS[color]`
- Stroke width: 1.5px for most pieces, 2px for King
- No raster fallbacks — pure SVG only
- All 12 components (6 types × 2 colors resolved at render, not file level)

---

## Game State Management

### chess.js integration

Use `chess.js` (v1.x) for all rule enforcement:

- Legal move generation (`chess.moves({ square, verbose: true })`)
- Move execution (`chess.move({ from, to, promotion })`)
- Check/checkmate/stalemate/draw detection (`chess.isCheck()`, `chess.isCheckmate()`, etc.)
- FEN serialization/deserialization (`chess.fen()`, `new Chess(fen)`)

`chess.js` is the single source of truth for board state. The Zustand store wraps it.

### useChessStore.ts (Zustand)

Key actions:

```typescript
selectSquare(index: SquareIndex): void   // highlight legal moves or execute move
executeMove(move: ChessMove): void
undoMove(): void                          // reverts last 2 half-moves (both players) in solo, 1 in local
resolvePromotion(piece: PieceType): void
requestHint(): void                       // deducts token, triggers Stockfish query
clearHint(): void
resetGame(): void
```

### chessReducer.ts

Pure function `(state: ChessGameState, action: ChessAction) => ChessGameState`. No side effects inside. All chess.js calls happen before dispatching (in the store action), reducer only transforms state shape.

---

## Stockfish.wasm Integration

### Architecture

```
ChessGamePage
  └── useStockfish(fen, difficulty) → { bestMove, isThinking }
        └── postMessage to stockfish.worker.ts
              └── Stockfish.wasm (Web Worker)
```

### stockfish.worker.ts

- Loads `stockfish.wasm` via `importScripts` or dynamic import
- Receives `{ type: "position", fen, depth }` messages
- Posts back `{ type: "bestmove", move: "e2e4" }` in UCI format
- Manages `ucinewgame` reset on game reset

### difficultyMap.ts

```typescript
export const DIFFICULTY_CONFIG = {
  easy: { skillLevel: 1, depth: 5, thinkMs: 500 },
  medium: { skillLevel: 8, depth: 10, thinkMs: 1000 },
  hard: { skillLevel: 20, depth: 18, thinkMs: 2000 },
} as const;
```

- `Skill Level` maps to Stockfish's `setoption name Skill Level value N` (0–20)
- `depth` is the search depth cap
- `thinkMs` is a minimum display delay so the AI doesn't feel instant on Easy

### useStockfish.ts

```typescript
function useStockfish(options: {
  fen: string;
  difficulty: Difficulty;
  enabled: boolean; // false when it's human's turn or game over
  onMove: (move: string) => void;
}): { isThinking: boolean };
```

- Sends position to worker when `enabled` flips to `true`
- Parses UCI `bestmove e2e4` response → calls `onMove("e2e4")`
- Handles worker lifecycle (init once, reuse across games)

### Hint extraction

Hints reuse the same Stockfish worker. When `requestHint()` is called:

1. Send current FEN to worker with hint-specific depth (always `depth: 12` regardless of difficulty)
2. Receive `bestmove` → store as `hintFrom` + `hintTo` in state
3. Deduct 1 hint token
4. Highlight squares for `HINT_DISPLAY_MS` (3000ms), then `clearHint()`

---

## Hint System

### hintConfig.ts

```typescript
export const HINT_TOKENS_PER_GAME = 3;
export const AUTO_HINT_INACTIVITY_MS = 30_000; // 30 seconds
export const HINT_DISPLAY_MS = 3_000;
```

### Token economy

- Each game starts with `HINT_TOKENS_PER_GAME` (3) tokens
- Each hint costs 1 token (manual button or auto-trigger both cost)
- At 0 tokens: hint button is disabled, auto-hint is suppressed
- Token count shown in `ChessHUD` with a neon badge

### useHintSystem.ts

```typescript
function useHintSystem(options: {
  enabled: boolean; // from settings.hintsEnabled
  autoDelayMs: number; // from settings.autoHintDelayMs
  tokens: number;
  isPlayerTurn: boolean;
  onRequestHint: () => void;
}): {
  secondsUntilAutoHint: number | null; // countdown shown in HUD
  canHint: boolean;
};
```

- Resets inactivity timer on every user interaction (square click, mouse move on board)
- Timer only runs on human player's turn, never during AI thinking
- When timer fires and tokens > 0 and `enabled`: call `onRequestHint()`

### Visual feedback

- `hintFrom` square: pulsing cyan ring (`--na-cyan` glow, 2Hz pulse animation)
- `hintTo` square: solid rose overlay with arrow indicator
- Framer Motion `AnimatePresence` wraps both highlights for smooth fade in/out
- Hint highlights render above piece layer but below drag overlay

---

## ChessBoard Component

### Square highlight layers (Z-order, bottom to top)

1. Base checkerboard color (`--na-board-light` / `--na-board-dark`)
2. Last move highlight (subtle purple tint on from+to)
3. Selected square (cyan border + inner glow)
4. Legal move dots (small dot for empty squares, ring for capture targets)
5. Hint highlights (pulsing cyan from, rose to)
6. Check highlight (red flicker on king square when in check)
7. Piece layer
8. Drag ghost (during drag-and-drop)

### Interaction model

- **Click-click**: click piece to select → click destination to move
- **Drag-and-drop**: drag piece to destination (HTML5 drag or pointer events)
- Both modes active simultaneously; whichever completes first executes the move
- On mobile: click-click only (no drag — too imprecise)
- Detect mobile via `pointer: coarse` media query

### Board orientation

- Solo (white): white pieces at bottom (default)
- Solo (black): black pieces at bottom (board flipped)
- Local: white at bottom always (no flip — shared device)
- Online: current player's color at bottom

---

## Promotion UI

### Flow

1. Player moves pawn to back rank → `promotionPending` is set in state
2. Game is paused (no moves accepted, AI halted)
3. `PromotionModal` mounts with `AnimatePresence` slide-up
4. Player picks: Queen / Rook / Bishop / Knight
5. `resolvePromotion(piece)` called → move executed → modal unmounts
6. In online mode: promotion choice is included in the move doc sent to Firebase

### PromotionModal design

- 4 large piece SVG buttons in a row
- Cyberpunk panel aesthetic (dark surface, cyan borders, no glass)
- Hover: piece glows with its color
- Keyboard accessible (Tab + Enter)
- Cannot be dismissed without choosing (no backdrop click close)

---

## Move History Panel

### MoveHistoryPanel

- Shows moves in pairs: `1. e4  e5   2. Nf3  Nc6 ...`
- Current move highlighted in cyan
- Scrolls to keep latest move visible
- Toggle visibility via `ChessSettings.showMoveHistory`
- On mobile: collapses to a drawer (slide up from bottom)
- On desktop: right sidebar, ~200px wide

---

## Captured Pieces Bar

### CapturedPiecesBar

- Renders small (20px) piece SVGs for all captured pieces
- Grouped by capturing player
- Shows material advantage delta (e.g. `+3`) if one side leads
- Toggle via `ChessSettings.showCapturedPieces`
- Positioned above/below board for each player

---

## Online Multiplayer

### Firebase RTDB schema (chess game doc)

```
/games/chess/{gameId}
  status: "waiting" | "active" | "finished" | "abandoned"
  gameType: "chess"
  fen: string                     // current position as FEN
  history: string[]               // SAN move list ["e4", "e5", "Nf3", ...]
  currentTurn: "white" | "black"
  playerWhite: { uid, nickname, queueEntryId? }
  playerBlack: { uid, nickname, queueEntryId? }
  winner: "white" | "black" | "draw" | null
  promotionPending: { from, to } | null
  lastMoveAt: number              // server timestamp (ms)
  createdAt: number
```

### Sync strategy

- Both clients subscribe to the game doc via `onValue(ref(rtdb, /games/chess/${gameId}))`
- Only the active player writes moves (prevents race conditions)
- On move: patch `{ fen, history, currentTurn, lastMoveAt }` atomically
- On promotion: patch includes `promotionPending` first, then await opponent resolution... No — promotion is resolved client-side by the moving player before committing. Patch includes the completed FEN post-promotion.
- Connection lost → `ConnectionLostBanner` (reuse existing component)

### chessGameService.ts

```typescript
createChessGame(playerWhite: GameDocPlayer, playerBlack?: GameDocPlayer): Promise<string>
joinChessGame(gameId: string, player: GameDocPlayer): Promise<void>
commitMove(gameId: string, move: ChessMove, newFen: string, newHistory: string[]): Promise<void>
subscribeChessGame(gameId: string, cb: (doc: ChessOnlineDoc) => void): Unsubscribe
resignGame(gameId: string, resigningColor: PieceColor): Promise<void>
```

### Matchmaking

Reuse the existing queue service. Add `gameType: "chess"` to queue entries so chess players only match with chess players.

---

## Settings Panel Extensions

Add a **Chess** section to the existing `SettingsPanel`:

| Toggle          | Default | Description                     |
| --------------- | ------- | ------------------------------- |
| Move History    | ON      | Show algebraic notation sidebar |
| Captured Pieces | ON      | Show captured pieces bar        |
| Allow Undo      | ON      | Enable undo/takeback button     |
| Hints           | ON      | Enable hint system              |
| Auto-hint delay | 30s     | Dropdown: Off / 15s / 30s / 60s |

Settings persist in `localStorage` under `neon-arena:chess-settings`.

---

## Animation Strategy

All animations respect `prefers-reduced-motion` via the existing `useReducedMotion` hook. When reduced motion is active, replace transitions with instant state changes.

### Piece move animation

- Use Framer Motion `layout` prop on piece elements
- Piece animates from source square to destination square (spring, stiffness 300, damping 30)
- Duration ~200ms for normal moves, ~100ms for undo

### Capture animation

- Captured piece plays a scale-down + fade-out before disappearing (150ms)
- Plays simultaneously with attacker's move animation

### Check flash

- King square gets a rapid red pulse (`--na-rose` glow, 3 pulses at 200ms each)
- CSS keyframe, not Framer Motion (avoids layout recalc)

### Checkmate

- King square holds the red glow (static, no pulse)
- `WinOverlay` mounts (reuse existing) with winner info
- Optional: particle burst using existing `tsparticles` confetti setup

### Castling

- Both King and Rook animate simultaneously via `layout`
- No special handling needed beyond moving both pieces in state

### En passant

- Captured pawn's square is highlighted briefly (100ms) before piece removal

### Hint highlight

- `from` square: Framer Motion keyframes, cyan ring scales 1.0→1.15→1.0 at 2Hz
- `to` square: rose overlay, fade in 200ms, hold, fade out 200ms on clear

---

## Shared Abstractions (Cross-Game Extensibility)

The following patterns established by Chess must be documented and reused for Connect4, Gomoku, etc.:

### 0. `GameConfig` object (drives shared pages)

```typescript
interface GameConfig {
  readonly gameType: GameType; // "chess" | "tictactoe" | ...
  readonly title: string; // "Chess"
  readonly description: string; // shown on ModeSelectPage
  readonly routePrefix: string; // "/play/chess"
  readonly modes: readonly GameMode[]; // which of the 4 modes are available
}
```

`ModeSelectPage` imports the config for the current route and renders generically. Adding a new game = adding a new config object and a route — no new page file.

### 1. `GamePageShell` (to extract from TicTacToe + Chess)

Wraps: `ParticleBackground`, `ConnectionLostBanner`, `SettingsPanel`, `WinOverlay`, route guard (redirect if no player). Both TicTacToe and Chess use this shell. Future games inherit it for free.

### 2. Game service interface

All games implement:

```typescript
interface GameService<TDoc> {
  createGame(host: GameDocPlayer, guest?: GameDocPlayer): Promise<string>;
  joinGame(gameId: string, player: GameDocPlayer): Promise<void>;
  subscribeGame(gameId: string, cb: (doc: TDoc) => void): Unsubscribe;
  resignGame(gameId: string, playerId: string): Promise<void>;
}
```

### 3. `useGameSettings<T>` hook

Generic hook for per-game settings with localStorage persistence:

```typescript
function useGameSettings<T>(gameKey: string, defaults: T): [T, (patch: Partial<T>) => void];
```

### 4. Queue entry `gameType` field

Already noted above — the matchmaking queue entry must carry `gameType` so future games don't cross-match.

### 5. Hint system

`useHintSystem` is game-agnostic. Takes `onRequestHint` callback. Any future game can plug in its own AI engine behind the same interface.

---

## Dependencies to Add

```bash
bun add chess.js               # move generation + validation
bun add stockfish              # stockfish.wasm (or use CDN worker URL)
```

> **Note on Stockfish bundle size**: `stockfish.wasm` is ~6MB. Load it lazily — only when the user enters a chess game in solo mode. Use dynamic `import()` inside the Web Worker. Other modes (local, online) do not need it.

---

## Acceptance Criteria

| #   | Criterion                                                                                         |
| --- | ------------------------------------------------------------------------------------------------- |
| 1   | All 4 game modes are playable end-to-end                                                          |
| 2   | Stockfish responds on all 3 difficulty levels; Easy is beatable                                   |
| 3   | All special moves work: castling, en passant, promotion                                           |
| 4   | Promotion modal appears and game halts until piece is chosen                                      |
| 5   | Check, checkmate, stalemate, and draw (50-move/repetition/insufficient material) are all detected |
| 6   | Hint tokens: start at 3, decrement on use, disable button at 0                                    |
| 7   | Auto-hint fires after inactivity threshold only on human's turn                                   |
| 8   | Hint highlight shows from+to squares visually for 3 seconds                                       |
| 9   | Move history panel shows correct SAN notation and scrolls to latest                               |
| 10  | Captured pieces bar shows correct pieces + material delta                                         |
| 11  | Undo works in solo (reverts both AI and player move) and local (reverts 1 move)                   |
| 12  | Online game stays in sync across two browser tabs within 300ms                                    |
| 13  | Board renders correctly at 375px viewport width without horizontal scroll                         |
| 14  | All animations disable cleanly under `prefers-reduced-motion`                                     |
| 15  | Stockfish worker is not loaded in local/online/friend modes                                       |
| 16  | Settings persist across page refresh via localStorage                                             |
| 17  | Resigning works in all modes; opponent sees result immediately in online                          |

---

## Out of Scope (v1)

- Clock / time control (bullet, blitz, classical timers)
- PGN export / import
- Opening explorer or endgame tablebase
- Takeback requests in online mode (undo is local-only)
- Chat during online game
- ELO / rating system
- Spectator mode
- Puzzle mode
