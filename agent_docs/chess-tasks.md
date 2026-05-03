# Implementation Plan: Chess — NeonArena

> **Spec:** `agent_docs/chess-spec.md`
> **Branch:** `feature/chess-implementation`
> **Status:** Ready to implement

---

## Overview

Add Chess as the second game in NeonArena. The implementation follows the same 4-mode shell (solo, local, online, friend) used by TicTacToe. Chess-specific logic (chess.js, Stockfish.wasm, hint system) lives under `src/lib/chess/` and `src/components/chess/`. Shared pages (`ModeSelectPage`, `NicknameEntryPage`, `MatchmakingPage`) are extended to accept a `gameConfig` prop so they remain game-agnostic.

---

## Architecture Decisions

- **chess.js v1.x** is the single source of truth for board state, move legality, and game-over detection. The Zustand store wraps it; the reducer is pure.
- **Stockfish.wasm** runs in a Web Worker and is lazily loaded only in solo mode to avoid a ~6 MB penalty on other modes.
- **Firebase RTDB** mirrors the TicTacToe online pattern — only the active player writes; both clients subscribe.
- **Shared pages refactor** is done first (Phase 1) because every subsequent routing task depends on it.
- **Vertical slicing** — each phase delivers a playable increment: foundation → solo → local → online → polish.

---

## Risks and Mitigations

| Risk                                | Impact | Mitigation                                                              |
| ----------------------------------- | ------ | ----------------------------------------------------------------------- |
| Stockfish.wasm bundle size (~6 MB)  | High   | Dynamic import inside Web Worker; never load in local/online modes      |
| chess.js API differences (v0 vs v1) | Medium | Pin to v1.x; read docs before use                                       |
| Firebase write races in online mode | Medium | Only active player writes; optimistic UI with rollback                  |
| Promotion modal blocking state      | Medium | Gate all move acceptance behind `promotionPending === null` check       |
| `prefers-reduced-motion` breakage   | Low    | Wrap all Framer Motion springs in `useReducedMotion` guard from day one |

---

## Open Questions

- Should `GamePageShell` be extracted from TicTacToe in this PR or as a follow-up? _(Spec says "to extract" — clarify before Phase 3)_
- Is `stockfish` npm package preferred over a CDN worker URL? _(Default: npm package; switch to CDN if bundle budget exceeded)_

---

## Task List

---

### Phase 1 — Foundation (Types, Routing, Shared Page Refactor)

> Goal: routes exist, shared pages accept `gameConfig`, Chess shows mode-select screen. No game logic yet.

- [x] **Task 1: Extend `GameType` union + add `GameConfig` interface**

  **Description:** Add `"chess"` to the `GameType` union in `src/types/game.ts`. Define the `GameConfig` interface (gameType, title, description, routePrefix, modes) in the same file or a new `src/types/gameConfig.ts`. This is the root type dependency for all chess work.

  **Acceptance criteria:**
  - [x] `GameType` includes `"chess"`
  - [x] `GameConfig` interface is exported and matches the spec exactly
  - [x] No existing TicTacToe code breaks (`vp check` passes)

  **Verification:**
  - [x] `vp check` — no TypeScript errors
  - [x] Search for `GameType` usages — all compile cleanly

  **Dependencies:** None

  **Files likely touched:**
  - `src/types/game.ts`

  **Estimated scope:** XS

---

- [x] **Task 2: Create `src/lib/chess/types.ts`**

  **Description:** Scaffold all Chess-specific TypeScript types from the spec: `PieceType`, `PieceColor`, `ChessPiece`, `SquareIndex`, `ChessMove`, `ChessStatus`, `PromotionPending`, `ChessGameState`, `ChessSettings`. These types are imported by every subsequent chess file.

  **Acceptance criteria:**
  - [x] All types match the spec exactly (no renamed fields)
  - [x] File compiles cleanly in isolation
  - [x] `ChessGameState` uses `readonly` on all array/object fields

  **Verification:**
  - [x] `vp check` — zero errors

  **Dependencies:** Task 1

  **Files likely touched:**
  - `src/lib/chess/types.ts` _(new)_

  **Estimated scope:** XS

---

- [x] **Task 3: Refactor `ModeSelectPage` to accept `gameConfig` prop**

  **Description:** Modify `src/pages/ModeSelect/index.tsx` to read game metadata (title, description, available modes, route prefix) from a `gameConfig: GameConfig` prop rather than hardcoded TicTacToe values. The existing TicTacToe usage must pass its own config object so behaviour is unchanged. Chess will pass a chess config object.

  **Acceptance criteria:**
  - [x] `ModeSelectPage` renders correctly for TicTacToe with its existing config
  - [x] No TicTacToe routes or behaviour change
  - [x] Component accepts `GameConfig` prop (typed, not `any`)

  **Verification:**
  - [x] Navigate to `/play/tictactoe` — mode select renders identically to before
  - [x] `vp check` — no errors

  **Dependencies:** Task 1

  **Files likely touched:**
  - `src/pages/ModeSelect/index.tsx`
  - `src/pages/ModeSelect/tictactoeConfig.ts` _(new — extract TicTacToe config object)_

  **Estimated scope:** S

---

- [x] **Task 4: Add Chess routes to `App.tsx` and create `chessConfig`**

  **Description:** Register chess routes in `src/App.tsx` following the TicTacToe pattern: `/play/chess` → `ModeSelectPage` (chess config), `/play/chess/nickname` → `NicknameEntryPage`, `/play/chess/matchmaking` → `MatchmakingPage`, `/play/chess/game` → `ChessGamePage` (stub), `/game/chess/:gameId` → `ChessGamePage` (stub). Create `src/pages/Chess/chessConfig.ts` with the chess `GameConfig` object.

  **Acceptance criteria:**
  - [x] `/play/chess` loads mode select with "Chess" title
  - [x] All 5 routes resolve without 404
  - [x] `ChessGamePage` stub renders a placeholder `<div>Chess Game — coming soon</div>`
  - [x] TicTacToe routes unaffected

  **Verification:**
  - [x] Manual: visit each route in browser
  - [x] `vp build` — no errors

  **Dependencies:** Tasks 2, 3

  **Files likely touched:**
  - `src/App.tsx`
  - `src/pages/Chess/GamePage.tsx` _(new — stub)_
  - `src/pages/Chess/chessConfig.ts` _(new)_

  **Estimated scope:** S

---

### Checkpoint — Phase 1

- [x] `vp check` passes with zero errors
- [x] `vp build` succeeds
- [x] Navigating to `/play/chess` shows Mode Select with "Chess" branding
- [x] All TicTacToe routes still work correctly

---

### Phase 2 — Chess Logic Core (chess.js, Zustand, Reducer)

> Goal: chess game state is fully managed in memory. No UI yet beyond the stub page.

- [ ] **Task 5: Install chess.js and wire initial Zustand store scaffold**

  **Description:** Run `bun add chess.js`. Create `src/lib/chess/state/useChessStore.ts` with a Zustand store that holds `ChessGameState` and exposes stub action signatures (`selectSquare`, `executeMove`, `undoMove`, `resolvePromotion`, `requestHint`, `clearHint`, `resetGame`). Actions are no-ops at this stage — just the shape.

  **Acceptance criteria:**
  - [ ] `chess.js` appears in `package.json`
  - [ ] Store exports a typed `useChessStore` hook
  - [ ] Initial state matches `ChessGameState` with starting FEN

  **Verification:**
  - [ ] `vp check` — no errors

  **Dependencies:** Task 2

  **Files likely touched:**
  - `package.json`
  - `bun.lockb`
  - `src/lib/chess/state/useChessStore.ts` _(new)_

  **Estimated scope:** S

---

- [ ] **Task 6: Implement `chessReducer.ts` — pure state transitions**

  **Description:** Create `src/lib/chess/state/chessReducer.ts` as a pure `(state, action) => state` function. Actions: `SELECT_SQUARE`, `EXECUTE_MOVE`, `UNDO_MOVE`, `RESOLVE_PROMOTION`, `SET_HINT`, `CLEAR_HINT`, `RESET_GAME`. No chess.js calls inside the reducer — only state shape transformations. chess.js calls happen in store actions before dispatching.

  **Acceptance criteria:**
  - [ ] Each action produces correct `ChessGameState` shape
  - [ ] Reducer is a pure function (no side effects, no imports from chess.js)
  - [ ] `promotionPending` is set correctly on `EXECUTE_MOVE` when pawn reaches back rank
  - [ ] `status` transitions follow `ChessStatus` enum correctly

  **Unit tests** (`src/lib/chess/state/chessReducer.test.ts`):
  - `SELECT_SQUARE` sets `selectedSquare` and populates `legalMoves`
  - `SELECT_SQUARE` on an occupied enemy square clears selection
  - `SELECT_SQUARE` on the same square deselects (toggles off)
  - `EXECUTE_MOVE` appends to `moveHistory` and clears `selectedSquare` + `legalMoves`
  - `EXECUTE_MOVE` sets `promotionPending` when a pawn reaches the back rank
  - `EXECUTE_MOVE` does not set `promotionPending` for non-promotion moves
  - `UNDO_MOVE` removes the last entry from `moveHistory`
  - `RESOLVE_PROMOTION` clears `promotionPending` and updates the board piece
  - `SET_HINT` sets `hintMove`; `CLEAR_HINT` nulls it
  - `RESET_GAME` returns initial state shape

  **Verification:**
  - [ ] `vp check` — no errors
  - [ ] Unit tests pass: `vp test src/lib/chess/state/chessReducer.test.ts`

  **Dependencies:** Task 5

  **Files likely touched:**
  - `src/lib/chess/state/chessReducer.ts` _(new)_
  - `src/lib/chess/state/chessReducer.test.ts` _(new)_

  **Estimated scope:** M

---

- [ ] **Task 7: Implement Zustand store actions using chess.js**

  **Description:** Fill in the store actions in `useChessStore.ts`. Each action calls chess.js for rule validation/execution, then dispatches to the reducer. Key logic: `selectSquare` shows legal moves or executes a move; `executeMove` handles promotion detection; `undoMove` reverts 1 or 2 half-moves depending on mode; `resetGame` reinitialises chess.js instance and resets state.

  **Acceptance criteria:**
  - [ ] `selectSquare` on a friendly piece highlights legal target squares
  - [ ] `selectSquare` on a legal target executes the move
  - [ ] `status` correctly becomes `"check"`, `"checkmate"`, `"stalemate"`, `"draw"` after moves
  - [ ] Castling, en passant, and promotion detection all work
  - [ ] `undoMove` reverts correctly

  **Unit tests** (`src/lib/chess/state/useChessStore.test.ts`):
  - `selectSquare` on a friendly piece populates `legalMoves` with correct squares
  - `selectSquare` on a legal target square executes the move and clears selection
  - `selectSquare` on an enemy piece does nothing when it is not the player's turn
  - After `selectSquare` executes a move, `moveHistory` length increments by 1
  - `status` becomes `"check"` after a move that puts the opponent in check (use Scholar's mate setup)
  - `status` becomes `"checkmate"` on Scholar's mate final move
  - `status` becomes `"stalemate"` on a known stalemate FEN
  - Castling move is accepted and king/rook positions update correctly
  - En passant capture removes the correct captured pawn
  - `selectSquare` on a pawn reaching back rank sets `promotionPending`
  - `undoMove` in local mode reverts exactly 1 half-move
  - `undoMove` in solo mode reverts 2 half-moves (player + AI)
  - `resetGame` restores starting FEN and clears all state

  **Verification:**
  - [ ] Manually import and call store actions in browser console on `/play/chess/game` stub
  - [ ] `vp check` — no errors
  - [ ] Unit tests pass: `vp test src/lib/chess/state/useChessStore.test.ts`

  **Dependencies:** Task 6

  **Files likely touched:**
  - `src/lib/chess/state/useChessStore.ts`
  - `src/lib/chess/state/useChessStore.test.ts` _(new)_

  **Estimated scope:** M

---

### Checkpoint — Phase 2

- [ ] `vp check` and `vp build` pass
- [ ] Chess game logic handles all special moves (verified via console)
- [ ] `status` transitions are correct for check / checkmate / stalemate / draw

---

### Phase 3 — Chess Piece SVGs + ChessBoard UI

> Goal: a functional, interactive board renders in the browser with correct piece art.

- [ ] **Task 8: Create `pieceTheme.ts` and `ChessPiece` SVG components**

  **Description:** Create `src/components/chess/ChessPiece/pieceTheme.ts` with `PIECE_COLORS` as specified. Then create the 6 SVG piece components (`King.tsx`, `Queen.tsx`, `Rook.tsx`, `Bishop.tsx`, `Knight.tsx`, `Pawn.tsx`) under `src/components/chess/ChessPiece/pieces/`. Each uses `viewBox="0 0 40 40"`, flat geometric cyberpunk style, `fill` and `stroke` from `PIECE_COLORS[color]`. Create the `ChessPiece/index.tsx` router component.

  **Acceptance criteria:**
  - [ ] All 6 piece types render as SVG for both `white` and `black`
  - [ ] `size` prop scales the SVG correctly
  - [ ] Hover glow via `filter: drop-shadow` is applied in CSS/className
  - [ ] All 12 visual variations (6 types × 2 colors) look correct in isolation

  **Verification:**
  - [ ] Add temporary `<ChessPiece piece={{ type: "queen", color: "white" }} />` to stub page and visually inspect

  **Dependencies:** Task 2

  **Files likely touched:**
  - `src/components/chess/ChessPiece/pieceTheme.ts` _(new)_
  - `src/components/chess/ChessPiece/pieces/King.tsx` _(new)_
  - `src/components/chess/ChessPiece/pieces/Queen.tsx` _(new)_
  - `src/components/chess/ChessPiece/pieces/Rook.tsx` _(new)_
  - `src/components/chess/ChessPiece/pieces/Bishop.tsx` _(new)_
  - `src/components/chess/ChessPiece/pieces/Knight.tsx` _(new)_
  - `src/components/chess/ChessPiece/pieces/Pawn.tsx` _(new)_
  - `src/components/chess/ChessPiece/index.tsx` _(new)_

  **Estimated scope:** L

---

- [ ] **Task 9: Create `Square.tsx` and `BoardLabels.tsx`**

  **Description:** Create `src/components/chess/ChessBoard/Square.tsx` — renders one square with all highlight layers (base checkerboard, last-move tint, selected glow, legal-move dot/ring, hint highlights, check flash) using CSS classes driven by props. Create `BoardLabels.tsx` for rank/file labels (a–h, 1–8) that flip when board is oriented for black.

  **Acceptance criteria:**
  - [ ] Square renders correct `--na-board-light` / `--na-board-dark` base color
  - [ ] Each highlight layer is visually distinct and toggled by props
  - [ ] Check flash uses CSS keyframe animation (not Framer Motion)
  - [ ] Board labels flip correctly when `flipped` prop is true

  **Verification:**
  - [ ] Visual inspection with all highlight states toggled on/off

  **Dependencies:** Task 2

  **Files likely touched:**
  - `src/components/chess/ChessBoard/Square.tsx` _(new)_
  - `src/components/chess/ChessBoard/BoardLabels.tsx` _(new)_

  **Estimated scope:** M

---

- [ ] **Task 10: Create `ChessBoard/index.tsx` — full 8×8 interactive board**

  **Description:** Compose `Square` and `ChessPiece` into a full board. Wire `selectSquare` from the store. Implement click-click interaction. Implement drag-and-drop using pointer events (disabled on `pointer: coarse` / mobile). Handle board orientation (flip for black in solo/online). Apply Framer Motion `layout` on piece elements for move animation.

  **Acceptance criteria:**
  - [ ] Board renders all 64 squares with correct initial piece placement
  - [ ] Click-click move interaction works end-to-end
  - [ ] Drag-and-drop works on desktop; gracefully absent on mobile
  - [ ] Board flips correctly for black player
  - [ ] Piece move animation plays (spring, ~200ms)
  - [ ] Capture animation: scale-down + fade-out (150ms)

  **Verification:**
  - [ ] Play a full game of local chess on the board
  - [ ] Test on 375px viewport — no horizontal scroll
  - [ ] `vp check` — no errors

  **Dependencies:** Tasks 7, 8, 9

  **Files likely touched:**
  - `src/components/chess/ChessBoard/index.tsx` _(new)_

  **Estimated scope:** L

---

### Checkpoint — Phase 3

- [ ] Full 8×8 board renders at `/play/chess/game`
- [ ] All pieces display with correct cyberpunk SVG art
- [ ] Click-click moves work; drag-and-drop works on desktop
- [ ] Board is playable for local 2-player (no AI yet)
- [ ] Renders without horizontal scroll at 375px

---

### Phase 4 — Supporting UI Components

> Goal: move history, captured pieces bar, HUD, and promotion modal.

- [ ] **Task 11: Create `MoveHistoryPanel`**

  **Description:** Create `src/components/chess/MoveHistoryPanel/index.tsx`. Renders move pairs in algebraic notation (`1. e4 e5  2. Nf3 Nc6 …`). Current move highlighted in cyan. Auto-scrolls to latest. On mobile, renders as a bottom drawer (slide up). Toggle via `ChessSettings.showMoveHistory`.

  **Acceptance criteria:**
  - [ ] SAN notation pairs render correctly
  - [ ] Current move is highlighted
  - [ ] Panel auto-scrolls to latest move
  - [ ] Hidden when `showMoveHistory` is false
  - [ ] Mobile drawer opens/closes correctly

  **Verification:**
  - [ ] Play 10 moves and verify notation matches chess.js history
  - [ ] Resize to 375px and verify drawer behaviour

  **Dependencies:** Task 7

  **Files likely touched:**
  - `src/components/chess/MoveHistoryPanel/index.tsx` _(new)_

  **Estimated scope:** M

---

- [ ] **Task 12: Create `CapturedPiecesBar`**

  **Description:** Create `src/components/chess/CapturedPiecesBar/index.tsx`. Renders 20px piece SVGs for all captured pieces, grouped by capturing player. Shows material advantage delta (`+3`). Toggle via `ChessSettings.showCapturedPieces`. Positioned above/below board.

  **Acceptance criteria:**
  - [ ] Correct pieces shown for each player after captures
  - [ ] Material delta is accurate
  - [ ] Hidden when `showCapturedPieces` is false

  **Unit tests** (`src/lib/chess/utils/materialCount.test.ts`):
  - Extract a pure `computeMaterialDelta(capturedByWhite, capturedByBlack): number` utility
  - Returns `0` when no pieces captured
  - Returns `+3` when white has captured a bishop and black has captured nothing
  - Returns `-5` when black has captured a rook and white has captured nothing
  - Returns `0` when captured material is equal on both sides
  - Sums correctly across mixed piece types (pawn=1, knight=3, bishop=3, rook=5, queen=9)

  **Verification:**
  - [ ] Capture several pieces and verify bars update correctly
  - [ ] Unit tests pass: `vp test src/lib/chess/utils/materialCount.test.ts`

  **Dependencies:** Tasks 7, 8

  **Files likely touched:**
  - `src/components/chess/CapturedPiecesBar/index.tsx` _(new)_
  - `src/lib/chess/utils/materialCount.ts` _(new — pure utility extracted for testability)_
  - `src/lib/chess/utils/materialCount.test.ts` _(new)_

  **Estimated scope:** S

---

- [ ] **Task 13: Create `ChessHUD`**

  **Description:** Create `src/components/chess/ChessHUD/index.tsx`. Shows: active player indicator, hint token counter (neon badge), hint button (disabled at 0 tokens), auto-hint countdown. Reuses existing `PlayerHUD` pattern for player info sections.

  **Acceptance criteria:**
  - [ ] Hint token count displays and decrements on use
  - [ ] Hint button is disabled at 0 tokens
  - [ ] Auto-hint countdown shows seconds remaining (or hidden when timer off)
  - [ ] Active player is visually highlighted

  **Verification:**
  - [ ] Use all 3 hints; verify button disables after third

  **Dependencies:** Task 2

  **Files likely touched:**
  - `src/components/chess/ChessHUD/index.tsx` _(new)_

  **Estimated scope:** S

---

- [ ] **Task 14: Create `PromotionModal`**

  **Description:** Create `src/components/chess/PromotionModal/index.tsx`. Mounts via Framer Motion `AnimatePresence` with a slide-up when `promotionPending !== null`. Shows 4 large piece SVG buttons (Queen, Rook, Bishop, Knight). Calls `resolvePromotion(piece)` on selection. Cannot be dismissed without choosing. Keyboard accessible (Tab + Enter).

  **Acceptance criteria:**
  - [ ] Modal appears exactly when a pawn reaches the back rank
  - [ ] All 4 promotion pieces are selectable
  - [ ] Game state is correctly updated with promoted piece
  - [ ] Backdrop click does NOT close the modal
  - [ ] Keyboard navigation works (Tab cycles, Enter selects)
  - [ ] Modal unmounts cleanly after selection

  **Verification:**
  - [ ] Manually promote a pawn and select each piece type
  - [ ] Verify keyboard accessibility

  **Dependencies:** Tasks 7, 8

  **Files likely touched:**
  - `src/components/chess/PromotionModal/index.tsx` _(new)_

  **Estimated scope:** M

---

### Checkpoint — Phase 4

- [ ] All supporting UI components render and function correctly
- [ ] Promotion modal blocks game until piece is chosen
- [ ] Move history shows correct notation
- [ ] Captured pieces bar shows accurate material counts

---

### Phase 5 — Stockfish AI + Hint System

> Goal: solo mode is playable against AI at 3 difficulty levels; hint system works.

- [ ] **Task 15: Create `difficultyMap.ts` and `stockfish.worker.ts`**

  **Description:** Create `src/lib/chess/engine/difficultyMap.ts` with `DIFFICULTY_CONFIG` as specified. Create `src/lib/chess/engine/stockfish.worker.ts` as a Web Worker that loads `stockfish.wasm` via dynamic import, handles UCI protocol messages (`ucinewgame`, `position fen …`, `go depth N`), and posts back `{ type: "bestmove", move: "e2e4" }`.

  **Acceptance criteria:**
  - [ ] Worker initialises without errors
  - [ ] Sending a FEN position returns a valid UCI best-move response
  - [ ] `ucinewgame` resets engine state correctly
  - [ ] Worker is never imported in non-solo code paths

  **Verification:**
  - [ ] Instantiate worker in browser console and send a test position; verify response

  **Dependencies:** Task 2

  **Files likely touched:**
  - `src/lib/chess/engine/difficultyMap.ts` _(new)_
  - `src/lib/chess/engine/stockfish.worker.ts` _(new)_

  **Estimated scope:** M

---

- [ ] **Task 16: Create `useStockfish` hook**

  **Description:** Create `src/lib/chess/engine/useStockfish.ts`. The hook manages the Web Worker lifecycle (init once, reuse across games). When `enabled` flips to `true`, sends the current FEN + difficulty depth to the worker, receives `bestmove`, applies the minimum `thinkMs` display delay, then calls `onMove(uciMove)`. Returns `{ isThinking }`.

  **Acceptance criteria:**
  - [ ] Hook sends position only when `enabled === true`
  - [ ] Minimum display delay is respected (Easy ~500ms, etc.)
  - [ ] Worker is only created for solo mode (caller responsibility via `enabled`)
  - [ ] `onMove` is called with a valid UCI move string
  - [ ] No memory leaks — worker is terminated on unmount

  **Verification:**
  - [ ] Wire to solo game; AI responds on each turn at each difficulty
  - [ ] `vp check` — no errors

  **Dependencies:** Task 15

  **Files likely touched:**
  - `src/lib/chess/engine/useStockfish.ts` _(new)_

  **Estimated scope:** M

---

- [ ] **Task 17: Create `hintConfig.ts` and `useHintSystem` hook**

  **Description:** Create `src/lib/chess/hints/hintConfig.ts` with `HINT_TOKENS_PER_GAME`, `AUTO_HINT_INACTIVITY_MS`, `HINT_DISPLAY_MS` constants. Create `src/lib/chess/hints/useHintSystem.ts`. The hook manages inactivity timer (resets on user interaction), fires auto-hint when threshold exceeded and tokens > 0, returns `{ secondsUntilAutoHint, canHint }`.

  **Acceptance criteria:**
  - [ ] Auto-hint fires after 30s inactivity on human's turn
  - [ ] Timer resets on square click or mouse move on board
  - [ ] Timer does not run during AI thinking
  - [ ] `canHint` is false at 0 tokens
  - [ ] Auto-hint is suppressed when `enabled` is false

  **Verification:**
  - [ ] Wait 30s without moving; verify hint fires
  - [ ] Use all 3 tokens; verify auto-hint stops

  **Dependencies:** Task 5

  **Files likely touched:**
  - `src/lib/chess/hints/hintConfig.ts` _(new)_
  - `src/lib/chess/hints/useHintSystem.ts` _(new)_

  **Estimated scope:** M

---

- [ ] **Task 18: Wire AI + hints into solo `ChessGamePage`**

  **Description:** Build out `src/pages/Chess/GamePage.tsx` for solo mode. Compose: `ChessBoard`, `ChessHUD`, `MoveHistoryPanel`, `CapturedPiecesBar`, `PromotionModal`, `WinOverlay` (reuse existing). Wire `useStockfish` for AI turns. Wire `useHintSystem` for hint token economy. Wire `requestHint` through Stockfish worker at depth 12. Display hint highlights on board.

  **Acceptance criteria:**
  - [ ] Solo game is fully playable vs AI at Easy / Medium / Hard
  - [ ] AI responds in < 1.5s on Easy/Medium, < 3s on Hard
  - [ ] Hint shows correct from+to squares for 3 seconds
  - [ ] `WinOverlay` appears on checkmate/stalemate/draw
  - [ ] Undo reverts both AI and player half-moves

  **Verification:**
  - [ ] Play a complete solo game to checkmate
  - [ ] Use a hint; verify highlight and token decrement
  - [ ] Test undo mid-game

  **Dependencies:** Tasks 10, 11, 12, 13, 14, 16, 17

  **Files likely touched:**
  - `src/pages/Chess/GamePage.tsx`

  **Estimated scope:** L

---

### Checkpoint — Phase 5

- [ ] Solo mode is fully playable end-to-end
- [ ] AI responds within spec latency targets
- [ ] Hint system (manual + auto) works correctly
- [ ] All acceptance criteria 1–10 from spec are met

---

### Phase 6 — Local & Online Multiplayer

> Goal: local pass-and-play and online Firebase modes are playable.

- [ ] **Task 19: Implement local (pass-and-play) mode in `ChessGamePage`**

  **Description:** Add local mode branch to `ChessGamePage`. No Stockfish loaded. Undo reverts 1 half-move (not 2). Board orientation always white-at-bottom. Players alternate on the same device.

  **Acceptance criteria:**
  - [ ] Local game plays correctly for 2 players
  - [ ] Undo reverts exactly 1 half-move
  - [ ] Stockfish worker is never instantiated

  **Verification:**
  - [ ] Play a full local game to checkmate
  - [ ] Verify `isThinking` is never true in local mode

  **Dependencies:** Task 18

  **Files likely touched:**
  - `src/pages/Chess/GamePage.tsx`

  **Estimated scope:** S

---

- [ ] **Task 20: Create Firebase RTDB schema + `chessGameService.ts`**

  **Description:** Create `src/lib/chess/online/chessGameService.ts` implementing `createChessGame`, `joinChessGame`, `commitMove`, `subscribeChessGame`, `resignGame`. The Firebase doc schema matches the spec (`/games/chess/{gameId}`). Add `gameType: "chess"` to queue entries so chess players match only with chess players.

  **Acceptance criteria:**
  - [ ] `createChessGame` writes correct initial doc to RTDB
  - [ ] `commitMove` atomically patches `{ fen, history, currentTurn, lastMoveAt }`
  - [ ] `subscribeChessGame` fires callback on every doc change
  - [ ] Queue entries carry `gameType: "chess"`

  **Unit tests** (`src/lib/chess/online/chessGameMappers.test.ts`):
  - `chessDocToGameState` maps `status: "waiting"` doc to `status: "idle"` game state
  - `chessDocToGameState` maps `status: "active"` doc with correct `currentTurn` color
  - `chessDocToGameState` maps `status: "finished"` + `winner: "draw"` to `status: "draw"`
  - `chessDocToGameState` maps `status: "finished"` + `winner: <uid>` to `status: "win"` with correct winner color
  - `chessDocToGameState` applies resign override: losing player's uid → `status: "win"` for opponent
  - `commitMovePayload` returns correct patch shape `{ fen, history, currentTurn, lastMoveAt }`

  **Verification:**
  - [ ] Open two browser tabs; verify move from tab A appears in tab B within 300ms
  - [ ] Unit tests pass: `vp test src/lib/chess/online/chessGameMappers.test.ts`

  **Dependencies:** Task 2

  **Files likely touched:**
  - `src/lib/chess/online/chessGameService.ts` _(new)_
  - `src/lib/chess/online/chessGameMappers.ts` _(new)_
  - `src/lib/chess/online/chessGameMappers.test.ts` _(new)_
  - `src/lib/firebase/queue.ts` _(modify — add gameType field)_

  **Estimated scope:** M

---

- [ ] **Task 21: Implement online mode in `ChessGamePage`**

  **Description:** Add online mode branch to `ChessGamePage`. Subscribe to Firebase doc on mount. Only the active player writes moves. Board orientation: current player's color at bottom. Resignation writes to Firebase and shows result to both players. `ConnectionLostBanner` (reuse existing) appears on disconnect.

  **Acceptance criteria:**
  - [ ] Two browser tabs stay in sync (< 300ms lag)
  - [ ] Non-active player's board is read-only
  - [ ] Resignation immediately shows result to both players
  - [ ] `ConnectionLostBanner` appears when Firebase connection drops

  **Verification:**
  - [ ] Play a complete online game across two browser tabs
  - [ ] Test resignation flow in both tabs

  **Dependencies:** Tasks 18, 20

  **Files likely touched:**
  - `src/pages/Chess/GamePage.tsx`

  **Estimated scope:** M

---

### Checkpoint — Phase 6

- [ ] Local pass-and-play is fully functional
- [ ] Online mode stays in sync across two tabs
- [ ] Resignation works in all modes
- [ ] Matchmaking queue correctly matches chess-only players

---

### Phase 7 — Settings, Persistence, Polish

> Goal: settings panel works, all animations are correct, mobile is solid.

- [ ] **Task 22: Implement `useGameSettings` hook + Chess settings panel section**

  **Description:** Create `src/lib/chess/state/useGameSettings.ts` as a generic `useGameSettings<T>(gameKey, defaults)` hook with `localStorage` persistence. Add a Chess section to the existing `SettingsPanel` component with toggles for: Move History, Captured Pieces, Allow Undo, Hints, Auto-hint delay. Persist under `neon-arena:chess-settings`.

  **Acceptance criteria:**
  - [ ] All 5 settings toggles work
  - [ ] Settings persist across page refresh
  - [ ] `useGameSettings` is generic and reusable (not chess-specific internally)
  - [ ] Existing TicTacToe settings section unaffected

  **Unit tests** (`src/lib/chess/state/useGameSettings.test.ts`):
  - Returns default values when `localStorage` has no entry for the key
  - Persists a changed setting to `localStorage` under the correct key
  - Restores persisted settings from `localStorage` on re-initialisation
  - Updating one field does not mutate other fields in the settings object
  - Handles corrupted `localStorage` JSON gracefully by falling back to defaults

  **Verification:**
  - [ ] Toggle each setting; refresh page; verify setting is preserved
  - [ ] Disable hints; verify hint button disappears from HUD
  - [ ] Unit tests pass: `vp test src/lib/chess/state/useGameSettings.test.ts`

  **Dependencies:** Task 2

  **Files likely touched:**
  - `src/lib/chess/state/useGameSettings.ts` _(new — generic hook)_
  - `src/lib/chess/state/useGameSettings.test.ts` _(new)_
  - `src/components/SettingsPanel/index.tsx` _(modify — add Chess section)_

  **Estimated scope:** M

---

- [ ] **Task 23: Polish animations + `prefers-reduced-motion` guard**

  **Description:** Audit all Framer Motion animations in chess components. Wrap every spring/transition in a `useReducedMotion()` guard — when true, replace with instant state changes. Verify: piece move spring, capture fade-out, checkmate glow, hint pulse, promotion modal slide-up. Add en passant captured pawn 100ms highlight.

  **Acceptance criteria:**
  - [ ] All animations play correctly under normal motion preference
  - [ ] All animations are instant/disabled under `prefers-reduced-motion: reduce`
  - [ ] Check flash uses CSS keyframe (not Framer Motion)
  - [ ] En passant captured pawn highlight is visible

  **Verification:**
  - [ ] Enable `prefers-reduced-motion` in browser DevTools; play through key moves
  - [ ] Verify check flash, checkmate glow, castling dual animation, hint pulse

  **Dependencies:** Task 18

  **Files likely touched:**
  - `src/components/chess/ChessBoard/index.tsx`
  - `src/components/chess/PromotionModal/index.tsx`
  - `src/components/chess/ChessHUD/index.tsx`
  - `src/components/chess/ChessBoard/Square.tsx`

  **Estimated scope:** M

---

- [ ] **Task 24: Mobile responsiveness audit**

  **Description:** Test the entire chess UI at 375px viewport width. Fix any horizontal scroll, overlapping elements, or oversized components. Verify move history collapses to bottom drawer. Verify drag-and-drop is disabled on touch devices (pointer: coarse). Verify captured pieces bar and HUD stack correctly on small screens.

  **Acceptance criteria:**
  - [ ] No horizontal scroll at 375px
  - [ ] All interactive elements are finger-tappable (min 44px touch target)
  - [ ] Drag-and-drop is absent on touch; click-click works
  - [ ] Move history renders as bottom drawer on mobile

  **Verification:**
  - [ ] Chrome DevTools mobile emulator at 375px — play through a game
  - [ ] Real device test if available

  **Dependencies:** Tasks 10, 11, 13

  **Files likely touched:**
  - Various CSS / Tailwind in chess components

  **Estimated scope:** M

---

### Checkpoint — Phase 7 (Final)

- [ ] `vp check` — zero TypeScript errors
- [ ] `vp build` — clean build
- [ ] All 17 acceptance criteria from `chess-spec.md` are met
- [ ] All 4 game modes are playable end-to-end
- [ ] 375px mobile viewport — no horizontal scroll
- [ ] `prefers-reduced-motion` disables all animations cleanly
- [ ] Settings persist after page refresh

---

## Full Task Index

| #   | Task                                            | Phase         | Size | Depends On    |
| --- | ----------------------------------------------- | ------------- | ---- | ------------- |
| 1   | Extend `GameType` + `GameConfig` interface      | Foundation    | XS   | —             |
| 2   | Create `src/lib/chess/types.ts`                 | Foundation    | XS   | 1             |
| 3   | Refactor `ModeSelectPage` for `gameConfig` prop | Foundation    | S    | 1             |
| 4   | Add Chess routes to `App.tsx`                   | Foundation    | S    | 2, 3          |
| 5   | Install chess.js + Zustand store scaffold       | Logic Core    | S    | 2             |
| 6   | Implement `chessReducer.ts`                     | Logic Core    | M    | 5             |
| 7   | Implement Zustand store actions via chess.js    | Logic Core    | M    | 6             |
| 8   | Chess piece SVG components                      | Board UI      | L    | 2             |
| 9   | `Square.tsx` + `BoardLabels.tsx`                | Board UI      | M    | 2             |
| 10  | `ChessBoard/index.tsx` — full interactive board | Board UI      | L    | 7, 8, 9       |
| 11  | `MoveHistoryPanel`                              | Supporting UI | M    | 7             |
| 12  | `CapturedPiecesBar`                             | Supporting UI | S    | 7, 8          |
| 13  | `ChessHUD`                                      | Supporting UI | S    | 2             |
| 14  | `PromotionModal`                                | Supporting UI | M    | 7, 8          |
| 15  | `difficultyMap.ts` + `stockfish.worker.ts`      | AI            | M    | 2             |
| 16  | `useStockfish` hook                             | AI            | M    | 15            |
| 17  | `hintConfig.ts` + `useHintSystem` hook          | AI            | M    | 5             |
| 18  | Wire AI + hints into solo `ChessGamePage`       | AI            | L    | 10–14, 16, 17 |
| 19  | Local pass-and-play mode                        | Multiplayer   | S    | 18            |
| 20  | Firebase RTDB schema + `chessGameService.ts`    | Multiplayer   | M    | 2             |
| 21  | Online mode in `ChessGamePage`                  | Multiplayer   | M    | 18, 20        |
| 22  | `useGameSettings` hook + settings panel         | Polish        | M    | 2             |
| 23  | Animation polish + reduced-motion guard         | Polish        | M    | 18            |
| 24  | Mobile responsiveness audit                     | Polish        | M    | 10, 11, 13    |
