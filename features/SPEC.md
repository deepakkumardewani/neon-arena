# Spec: NeonArena — Web Game Portal (Phase 1: TicTacToe)

> **Status:** Approved — ready for implementation  
> **Last updated:** 2026-04-15  
> **PRD reference:** PRD.md

---

## Objective

Build a dark-themed, neon-cyberpunk web game portal called **NeonArena** (working title). Phase 1 ships TicTacToe as the flagship game. The portal must feel premium, unique, and addictive — nothing like generic game sites. Players jump in with zero friction (no signup), pick a nickname, and play.

### Who is the user?
- **Casual mobile player** — wants to kill 5 minutes, looks cool doing it
- **Competitive solo player** — wants to beat AI, track W/L/D
- **Local pair** — two people on one device, pass-and-play

### What does success look like?
- Player completes ≥ 2 games per session
- FCP < 1.5s on 4G mobile
- Online matchmaking completes in < 10s median
- Players want to come back (the UI is the hook)

---

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | React | 19.x |
| Language | TypeScript | 5.x, strict mode |
| Toolchain | **Vite+** (`vp` CLI) | VoidZero unified toolchain — wraps Vite, Vitest, Oxlint, Oxfmt, Rolldown |
| Styling | Tailwind CSS | v4.x with custom CSS variables for neon theme |
| Routing | React Router | v7.x (client-side only, no SSR) |
| State (local) | Zustand | Lightweight, no boilerplate |
| Backend / DB | Firebase | Firestore (game state, scores, queue) + RTDB (presence) — accessed only via service layer, never directly from components or hooks |
| Auth | Firebase Anonymous Auth | Silent, invisible to user |
| Haptics | web-haptics | `github:lochie/web-haptics` — wrapped in abstraction layer |
| Audio | Howler.js | Web Audio API wrapper, handles autoplay policy |
| Animation (UI) | Framer Motion | Route transitions, overlay mount/unmount, hover states, drawer slide-in |
| Animation (Glyphs) | CSS keyframes | X/O stroke draw-on via `stroke-dashoffset`; winning line glow pulse |
| Particles | tsparticles | Home screen ambient particle drift + win confetti burst |
| Testing | Vitest + React Testing Library | Unit + component tests |
| Deployment | Vercel | Default `vercel.app` domain at launch |

---

## Commands

```bash
# Install Vite+ globally (once per machine)
curl -fsSL https://vite.plus | bash   # macOS/Linux
# or: irm https://vite.plus/ps1 | iex  (Windows PowerShell)

# Project setup
vp create          # scaffold new React + TypeScript project
vp install         # install all dependencies

# Development
vp dev             # start dev server (http://localhost:5173)
vp check           # format + lint + type-check in one pass
vp lint            # Oxlint only
vp fmt             # Oxfmt only

# Testing
vp test            # run Vitest (watch mode in dev, CI mode in pipeline)
vp test --coverage # with coverage report

# Build & Preview
vp build           # production build → dist/
vp preview         # preview production build locally

# CI (GitHub Actions / Vercel)
vp check && vp test && vp build
```

---

## Project Structure

```
neon-arena/
├── public/
│   ├── audio/                  # SFX and music tracks (mp3)
│   │   ├── place.mp3
│   │   ├── win.mp3
│   │   ├── lose.mp3
│   │   ├── draw.mp3
│   │   ├── click.mp3
│   │   ├── bg-home.mp3         # home screen music
│   │   └── bg-game.mp3         # in-game music
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                # app entry point
│   ├── App.tsx                 # router + global providers
│   │
│   ├── pages/
│   │   ├── Home/               # arcade portal home
│   │   │   ├── index.tsx
│   │   │   └── Home.test.tsx
│   │   ├── ModeSelect/         # game mode selection
│   │   │   ├── index.tsx
│   │   │   └── ModeSelect.test.tsx
│   │   ├── NicknameEntry/      # nickname input screen
│   │   │   ├── index.tsx
│   │   │   └── NicknameEntry.test.tsx
│   │   ├── Matchmaking/        # online matchmaking waiting screen
│   │   │   ├── index.tsx
│   │   │   └── Matchmaking.test.tsx
│   │   └── Game/               # TicTacToe game screen
│   │       ├── index.tsx
│   │       └── Game.test.tsx
│   │
│   ├── components/
│   │   ├── GameCard/           # portal home game card
│   │   ├── GameBoard/          # 3×3 TicTacToe board
│   │   ├── GlyphX/             # animated SVG X with glow
│   │   ├── GlyphO/             # animated SVG O with glow
│   │   ├── PlayerHUD/          # top bar: names, scores, controls
│   │   ├── WinOverlay/         # end-game overlay + confetti
│   │   ├── MatchmakingScreen/  # radar animation + queue count
│   │   ├── SettingsPanel/      # slide-in audio settings drawer
│   │   ├── OnlineCounter/      # live presence badge
│   │   ├── NicknameInput/      # validated nickname text input
│   │   ├── ModeCard/           # individual mode selection card
│   │   └── ParticleBackground/ # ambient tsparticles background
│   │
│   ├── hooks/
│   │   ├── useGameStore.ts     # Zustand game state
│   │   ├── usePlayerStore.ts   # Zustand player/session state
│   │   ├── useAudioStore.ts    # Zustand audio settings state
│   │   ├── usePresence.ts      # Firebase RTDB presence hook
│   │   ├── useMatchmaking.ts   # Firestore matchmaking queue hook
│   │   ├── useOnlineGame.ts    # Firestore real-time game sync hook
│   │   └── useScore.ts         # Firestore score read/write hook
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── minimax.ts      # minimax with alpha-beta pruning
│   │   │   ├── medium.ts       # medium strategy (win/block/random)
│   │   │   └── easy.ts         # random move selection
│   │   ├── game/
│   │   │   ├── logic.ts        # win detection, board utilities
│   │   │   └── logic.test.ts   # unit tests for all win conditions
│   │   ├── audio/
│   │   │   └── audioManager.ts # Howler.js singleton
│   │   ├── haptics/
│   │   │   └── hapticManager.ts # web-haptics abstraction layer
│   │   └── firebase/
│   │       ├── auth.ts         # anonymous sign-in helpers
│   │       ├── presence.ts     # RTDB presence write/cleanup
│   │       ├── queue.ts        # Firestore matchmaking queue ops
│   │       ├── game.ts         # Firestore game doc CRUD
│   │       └── scores.ts       # Firestore score read/increment
│   │
│   ├── styles/
│   │   ├── globals.css         # Tailwind base + CSS custom properties
│   │   └── animations.css      # keyframe animations (glow pulse, draw-on)
│   │
│   └── types/
│       ├── game.ts             # GameMode, Difficulty, BoardCell, GameStatus
│       ├── player.ts           # Player, Score
│       └── firebase.ts         # Firestore document shapes
│
├── spec/                       # this file and supporting docs
│   ├── SPEC.md
│   └── PRD.md
│
├── .env.example                # Firebase config keys (never commit .env)
├── vite.config.ts              # Vite+ config
├── tailwind.config.ts
├── tsconfig.json               # strict mode enabled
└── package.json
```

---

## Code Style

### Principles
- **Strict TypeScript** — no `any`, no implicit returns, exhaustive switch cases
- **Named exports** — no default exports except pages (React Router convention)
- **Co-located tests** — `*.test.tsx` next to the file being tested
- **CSS variables for theming** — never hardcode color hex values in components; always use CSS vars
- **Hooks own side effects** — components are pure renderers; all Firebase/audio/haptic calls live in hooks or lib

### Naming Conventions
| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `GameBoard`, `WinOverlay` |
| Hooks | camelCase with `use` prefix | `useGameStore`, `usePresence` |
| Types/Interfaces | PascalCase | `GameState`, `PlayerScore` |
| Constants | SCREAMING_SNAKE | `MAX_NICKNAME_LENGTH`, `WIN_CONDITIONS` |
| CSS variables | `--na-` prefix | `--na-cyan`, `--na-rose`, `--na-bg` |
| Firebase collections | lowercase kebab | `queue`, `games`, `scores` |

### Reference Code Snippet

```tsx
// src/components/GameBoard/index.tsx
import { useGameStore } from '@/hooks/useGameStore'
import { GlyphX } from '@/components/GlyphX'
import { GlyphO } from '@/components/GlyphO'
import { hapticManager } from '@/lib/haptics/hapticManager'
import { audioManager } from '@/lib/audio/audioManager'
import { checkWinner } from '@/lib/game/logic'
import type { BoardCell } from '@/types/game'

const WIN_CONDITIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
] as const

export function GameBoard() {
  const { board, currentTurn, makeMove, isMyTurn } = useGameStore()

  function handleCellClick(index: number) {
    if (board[index] !== null || !isMyTurn) return

    makeMove(index)
    hapticManager.place()
    audioManager.play('place')
  }

  return (
    <div
      className="grid grid-cols-3 aspect-square w-full max-w-[480px] mx-auto"
      style={{ gap: '2px' }}
      role="grid"
      aria-label="TicTacToe board"
    >
      {board.map((cell: BoardCell, index: number) => (
        <button
          key={index}
          onClick={() => handleCellClick(index)}
          disabled={cell !== null || !isMyTurn}
          aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ', empty'}`}
          className="cell-btn flex items-center justify-center"
          style={{ cursor: cell !== null ? 'not-allowed' : 'pointer' }}
        >
          {cell === 'X' && <GlyphX animate />}
          {cell === 'O' && <GlyphO animate />}
        </button>
      ))}
    </div>
  )
}
```

```ts
// src/styles/globals.css — CSS variables (abbreviated)
:root {
  --na-bg:        #0A0A0F;
  --na-cyan:      #00F5FF;
  --na-rose:      #FF2D78;
  --na-purple:    #7B61FF;
  --na-glow-x:    0 0 12px #00F5FF, 0 0 40px #00F5FF88;
  --na-glow-o:    0 0 12px #FF2D78, 0 0 40px #FF2D7888;
  --na-glow-grid: 0 0 6px #7B61FF44;
}
```

```css
/* src/styles/animations.css — glyph draw-on via stroke-dashoffset */

@keyframes draw-x-stroke {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}

@keyframes draw-o-stroke {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}

@keyframes glow-pulse-win {
  0%, 100% { filter: drop-shadow(0 0 8px var(--na-cyan)); }
  50%       { filter: drop-shadow(0 0 24px var(--na-cyan)) drop-shadow(0 0 48px var(--na-cyan)); }
}

@keyframes radar-pulse {
  0%   { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.4); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
/* GlyphX — SVG with CSS stroke-dashoffset draw-on */
export function GlyphX({ animate }: { animate?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-4">
      <line
        x1="20" y1="20" x2="80" y2="80"
        stroke="var(--na-cyan)" strokeWidth="10" strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
        style={{
          filter: 'var(--na-glow-x)',
          animation: animate ? 'draw-x-stroke 200ms ease-out forwards' : 'none',
        }}
      />
      <line
        x1="80" y1="20" x2="20" y2="80"
        stroke="var(--na-cyan)" strokeWidth="10" strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
        style={{
          filter: 'var(--na-glow-x)',
          animation: animate ? 'draw-x-stroke 200ms ease-out 80ms forwards' : 'none',
        }}
      />
    </svg>
  )
}
```

```ts
// src/lib/haptics/hapticManager.ts — abstraction layer
import { haptic } from 'web-haptics'

export const hapticManager = {
  place: () => { try { haptic(50) } catch { /* unsupported */ } },
  win:   () => { try { haptic([80, 60, 80, 60, 80]) } catch { /* unsupported */ } },
  tap:   () => { try { haptic(20) } catch { /* unsupported */ } },
}
```

---

## Testing Strategy

### Framework
- **Vitest** (via `vp test`) — fast, Vite-native, compatible with Jest API
- **React Testing Library** — component tests, user-event simulation
- **@testing-library/user-event** — realistic user interactions

### Test Locations
```
src/lib/game/logic.test.ts         # pure function unit tests (win detection, AI)
src/lib/ai/minimax.test.ts         # AI correctness: hard mode never loses
src/components/GameBoard/GameBoard.test.tsx
src/components/WinOverlay/WinOverlay.test.tsx
src/pages/NicknameEntry/NicknameEntry.test.tsx
src/hooks/useGameStore.test.ts
src/pages/FriendLobby/FriendLobby.test.tsx
```

### Coverage Requirements
- `src/lib/game/logic.ts` — **100%** (win detection is critical; no untested paths)
- `src/lib/ai/` — **100%** (AI correctness is product-critical)
- `src/components/` — **≥ 70%** line coverage
- `src/pages/` — **≥ 60%** line coverage
- `src/hooks/` — **≥ 60%** line coverage
- Firebase lib (`src/lib/firebase/`) — **mocked**, not tested against real Firebase

### Test Levels

| Level | Scope | Tool | Example |
|---|---|---|---|
| Unit | Pure functions | Vitest | All 8 win conditions, minimax correctness |
| Component | Isolated UI | RTL | GameBoard renders, cell click disables, glyph appears |
| Integration | Hook + component | RTL | useGameStore + GameBoard: move updates board |
| Firebase | Mocked | Vitest mock | queue write called on matchmaking enter |
| E2E | Not in Phase 1 | — | Deferred to Phase 2 |

### Key Test Cases (must exist before ship)
```ts
// Win detection — all 8 conditions
describe('checkWinner', () => {
  it('detects row win', ...)
  it('detects column win', ...)
  it('detects diagonal win', ...)
  it('returns null on incomplete board', ...)
  it('returns draw when board full with no winner', ...)
})

// AI — hard mode never loses
describe('minimax', () => {
  it('always wins or draws from any board state', ...)
  it('takes winning move when available', ...)
  it('blocks opponent winning move', ...)
})

// Nickname validation
describe('NicknameInput', () => {
  it('rejects < 2 chars', ...)
  it('rejects > 16 chars', ...)
  it('rejects spaces and special chars', ...)
  it('accepts alphanumeric + underscore', ...)
})
```

---

## Architecture Decisions

### State Management
- **Zustand** stores: `gameStore` (board, turn, mode, status), `playerStore` (nicknames, UID, scores), `audioStore` (volumes, mute state)
- Store state is the single source of truth — Firebase writes are side effects triggered by store actions
- Online mode: Firebase `onSnapshot` listener calls store actions to update board

### Routing
```
/               → Home (arcade portal)
/play/tictactoe → ModeSelect
/play/tictactoe/nickname → NicknameEntry
/play/tictactoe/matchmaking → Matchmaking (online only)
/play/tictactoe/game → Game
/game/:gameId          → Game (direct join via shareable link)
```
- React Router v7 with `createBrowserRouter`
- Game state passed via Zustand, not URL params (except gameId for online)

### Firebase Architecture
```
Firestore:
  queue/{uid}          ← written on matchmaking enter, deleted on match
  games/{gameId}       ← game document, updated per move
  scores/{uid}         ← W/L/D counters, updated on game end

RTDB:
  /presence/{uid}      ← written on connect, cleared onDisconnect
```
- **Matchmaking pairing** is client-side: first player writes to queue; second player's `onSnapshot` of queue finds a waiting player, creates a `games` doc, removes both from queue
- This avoids Cloud Functions in Phase 1 (simpler, zero cost). Risk: race condition with 3+ simultaneous joiners — mitigated with Firestore transactions

### Animation Strategy
Animations split into two categories — each uses the right tool:

| Animation | Tool | Reason |
|---|---|---|
| WinOverlay / SettingsPanel mount & unmount | Framer Motion `AnimatePresence` | State-driven show/hide with exit animations |
| Route transitions (Home → Game etc.) | Framer Motion `motion.div` | Declarative, integrates with React Router |
| GameCard hover glow intensify | Framer Motion `whileHover` | Clean gesture-based prop |
| Matchmaking radar pulse | CSS `@keyframes` | Simple infinite loop, no JS needed |
| X glyph draw-on stroke | CSS `stroke-dashoffset` animation | SVG path animation, zero library cost |
| O glyph draw-on stroke | CSS `stroke-dashoffset` animation | SVG path animation, zero library cost |
| Winning line glow pulse | CSS `@keyframes` + `animation-iteration-count: infinite` | Pure CSS, GPU-composited |
| Grid line ambient glow | CSS `box-shadow` | Static, no animation library needed |
| Confetti burst on win | tsparticles (already in stack) | Purpose-built, performant |
| Home ambient particle drift | tsparticles | Same instance, different config |

**Why not GSAP:** GSAP excels at complex imperative timelines. NeonArena's animations are state-driven (show/hide overlays, route changes) or pure CSS loops — Framer Motion handles the former more naturally in React, and CSS handles the latter with zero bundle cost. The glyph draw-on effect specifically is cleaner as `stroke-dashoffset` CSS than GSAP's `DrawSVG` plugin (which also requires a paid Club membership).

**`prefers-reduced-motion`:** All Framer Motion variants and CSS animations must check this. Framer Motion respects it via `useReducedMotion()` hook; CSS animations via `@media (prefers-reduced-motion: reduce)`.

### Service Layer (Backend Abstraction)

Firebase is accessed **exclusively** through a service layer. No component, hook, or store imports from `firebase/*` directly. This means swapping Firebase for Supabase, PocketBase, a custom WebSocket server, or anything else requires only rewriting the `src/lib/services/firebase/` implementations — zero changes to UI, hooks, or stores.

#### Interface Contracts

```ts
// src/lib/services/interfaces/IAuthService.ts
export interface IAuthService {
  signInAnonymously(): Promise<{ uid: string }>
  getCurrentUser(): { uid: string } | null
  onAuthStateChanged(cb: (user: { uid: string } | null) => void): () => void
}

// src/lib/services/interfaces/IGameService.ts
export interface GameDoc {
  gameId: string
  playerX: { uid: string; nickname: string }
  playerO: { uid: string; nickname: string } | null
  board: (null | 'X' | 'O')[]
  currentTurn: string
  status: 'waiting' | 'active' | 'finished' | 'abandoned' | 'expired'
  winner: string | 'draw' | null
  createdAt: number
  expiresAt: number
  disconnectedAt: number | null
  rematch: Record<string, boolean>
}

export interface IGameService {
  createGame(playerX: { uid: string; nickname: string }): Promise<string>       // returns gameId
  joinGame(gameId: string, playerO: { uid: string; nickname: string }): Promise<void>
  makeMove(gameId: string, cellIndex: number, player: 'X' | 'O'): Promise<void>
  subscribeToGame(gameId: string, cb: (game: GameDoc) => void): () => void      // returns unsubscribe
  setDisconnected(gameId: string, uid: string): Promise<void>
  acceptRematch(gameId: string, uid: string): Promise<string>                   // returns new gameId
  getGame(gameId: string): Promise<GameDoc | null>
}

// src/lib/services/interfaces/IScoreService.ts
export interface ScoreDoc {
  uid: string
  nickname: string
  wins: number
  losses: number
  draws: number
}

export interface IScoreService {
  getScore(uid: string): Promise<ScoreDoc | null>
  incrementScore(uid: string, result: 'win' | 'loss' | 'draw', nickname: string): Promise<void>
}

// src/lib/services/interfaces/IPresenceService.ts
export interface IPresenceService {
  connect(uid: string, nickname: string): Promise<void>
  disconnect(uid: string): Promise<void>
  subscribeToCount(cb: (count: number) => void): () => void                     // returns unsubscribe
}

// src/lib/services/interfaces/IQueueService.ts
export interface IQueueService {
  enqueue(uid: string, nickname: string): Promise<void>
  dequeue(uid: string): Promise<void>
  subscribeToQueue(cb: (queue: { uid: string; nickname: string }[]) => void): () => void
}
```

#### Dependency Injection Binding

```ts
// src/lib/services/index.ts — THE ONLY FILE YOU CHANGE TO SWAP BACKEND
import { FirebaseAuthService }     from './firebase/FirebaseAuthService'
import { FirebaseGameService }     from './firebase/FirebaseGameService'
import { FirebaseScoreService }    from './firebase/FirebaseScoreService'
import { FirebasePresenceService } from './firebase/FirebasePresenceService'
import { FirebaseQueueService }    from './firebase/FirebaseQueueService'
import type { IAuthService }       from './interfaces/IAuthService'
import type { IGameService }       from './interfaces/IGameService'
import type { IScoreService }      from './interfaces/IScoreService'
import type { IPresenceService }   from './interfaces/IPresenceService'
import type { IQueueService }      from './interfaces/IQueueService'

export const authService: IAuthService         = new FirebaseAuthService()
export const gameService: IGameService         = new FirebaseGameService()
export const scoreService: IScoreService       = new FirebaseScoreService()
export const presenceService: IPresenceService = new FirebasePresenceService()
export const queueService: IQueueService       = new FirebaseQueueService()

// To swap to Supabase tomorrow:
// import { SupabaseGameService } from './supabase/SupabaseGameService'
// export const gameService: IGameService = new SupabaseGameService()
```

#### Hooks consume services, never Firebase directly

```ts
// src/hooks/useScore.ts — correct pattern
import { scoreService } from '@/lib/services'   // ✅ service layer
// import { doc, getDoc } from 'firebase/firestore' ← NEVER do this in a hook

export function useScore(uid: string) {
  const [score, setScore] = useState<ScoreDoc | null>(null)

  useEffect(() => {
    scoreService.getScore(uid).then(setScore)
  }, [uid])

  return score
}
```

#### How to swap backend in future
1. Create `src/lib/services/{new-provider}/` folder
2. Implement each interface (5 files)
3. Update `src/lib/services/index.ts` to import new implementations
4. Delete `src/lib/services/firebase/` and `src/lib/firebase/`
5. Done — zero changes to hooks, components, stores, or pages

### Online Multiplayer Backend Decision
- **Firebase Firestore** chosen over WebSockets/Yjs for all online modes
- Rationale: all games in the portal (TicTacToe, Chess, Checkers, Battleship) are strictly turn-based — no simultaneous edits, so CRDTs (Yjs) solve a problem that doesn't exist here
- Firebase already handles auth, scores, and presence — adding a WebSocket server would mean two backends with no latency benefit perceptible in turn-based play
- Revisit if a real-time simultaneous game (e.g. multiplayer shooter) is added in future phases

### Audio System
- Howler.js singleton initialized on first user gesture (click/tap)
- Two sprite groups: `sfx` (place, win, lose, draw, click) and `music` (bg-home, bg-game)
- Music crossfades between home and game on route change (500ms fade)
- All volumes and mute state persisted to localStorage

### Haptics
- `web-haptics` library wrapped in `hapticManager.ts`
- All calls inside `try/catch` — failure is silent
- Three patterns: `place` (50ms), `win` (triple pulse), `tap` (20ms)

---

## Design Tokens

```css
/* All components MUST use these variables — never raw hex */

/* Colors */
--na-bg:           #0A0A0F;    /* page background */
--na-surface:      #12121A;    /* card/panel background */
--na-border:       #1E1E2E;    /* subtle borders */
--na-cyan:         #00F5FF;    /* X glyph, primary CTA */
--na-rose:         #FF2D78;    /* O glyph, secondary */
--na-purple:       #7B61FF;    /* grid lines, accents */
--na-text:         #E2E8F0;    /* body text */
--na-text-muted:   #64748B;    /* secondary text */

/* Glows */
--na-glow-x:       0 0 12px #00F5FF, 0 0 40px #00F5FF66;
--na-glow-o:       0 0 12px #FF2D78, 0 0 40px #FF2D7866;
--na-glow-grid:    0 0 8px #7B61FF44;
--na-glow-win:     0 0 20px #00F5FF, 0 0 60px #00F5FFAA; /* intensified */

/* Typography */
--na-font-display: 'Orbitron', sans-serif;   /* headings, scores */
--na-font-body:    'Inter', sans-serif;       /* labels, descriptions */

/* Breakpoints (use in Tailwind config) */
--na-bp-sm:  375px;
--na-bp-md:  768px;
--na-bp-lg:  1280px;
```

---

## Firebase Data Shapes

### `queue/{uid}`
```ts
interface QueueEntry {
  uid: string
  nickname: string
  joinedAt: Timestamp
  status: 'waiting' | 'matched'
}
```

### `games/{gameId}`
```ts
interface GameDoc {
  gameId: string
  playerX: { uid: string; nickname: string }
  playerO: { uid: string; nickname: string }
  board: (null | 'X' | 'O')[]   // length 9, index 0–8
  currentTurn: string             // uid of whose turn it is
  status: 'waiting' | 'active' | 'finished' | 'abandoned'
  winner: string | 'draw' | null  // uid, 'draw', or null
  createdAt: Timestamp
  disconnectedAt: Timestamp | null
  rematch: { [uid: string]: boolean }  // uid → true when accepted
}
```

### `scores/{uid}`
```ts
interface ScoreDoc {
  uid: string
  nickname: string
  wins: number
  losses: number
  draws: number
  updatedAt: Timestamp
}
```

### RTDB `/presence/{uid}`
```ts
interface PresenceEntry {
  nickname: string
  connectedAt: number  // Date.now()
}
// removed via onDisconnect on tab close
```

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Queue: read all, write only own entry
    match /queue/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Games: participants only
    match /games/{gameId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && (request.auth.uid == resource.data.playerX.uid
         || request.auth.uid == resource.data.playerO.uid);
    }

    // Scores: read all, write only own
    match /scores/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

---

## Boundaries

### Always Do
- Run `vp check` before every commit (format + lint + type-check)
- Run `vp test` before merging any PR
- Use CSS variables (`--na-*`) for all colors — never raw hex in components
- Wrap all `web-haptics` calls in try/catch
- Validate nickname client-side AND display error before submitting
- Use Zustand stores as the single source of truth — Firebase is a side effect
- Commit `SPEC.md` and `PRD.md` to the repo (`spec/` directory)
- Keep audio initialization deferred to first user gesture
- Import backend services ONLY from `@/lib/services` — never import Firebase SDK directly in hooks, components, or stores
- Use Framer Motion `AnimatePresence` for all component mount/unmount transitions
- Use CSS `stroke-dashoffset` for glyph draw-on animations — never JS-driven per-frame updates
- Call `useReducedMotion()` in animated components and skip animations when true

### Ask First (do not proceed without confirmation)
- Adding a new bun dependency
- Changing any Firestore collection name or document field name
- Changing Firestore security rules
- Changing routing structure
- Adding Cloud Functions (Phase 1 is client-only)
- Switching state management approach
- Switching animation library (Framer Motion → GSAP or vice versa)
- Changing any interface in `src/lib/services/interfaces/` without team discussion (breaking change)
- Changing the CSS variable naming convention (`--na-*`)
- Adding a new breakpoint

### Never Do
- Commit `.env` or any Firebase config with real API keys (use `.env.example`)
- Use `any` in TypeScript
- Write directly to a Firestore document that isn't owned by the current user
- Call Firebase before `signInAnonymously()` completes
- Hardcode hex colors in component files
- Use GSAP or any JS animation library for glyph stroke animations (CSS only for these)
- Import `firebase/*` SDK packages anywhere outside of `src/lib/services/firebase/` and `src/lib/firebase/client.ts` — this breaks the abstraction layer
- Delete or skip failing tests — fix them or open a discussion
- Ship a feature not in `SPEC.md` without updating the spec first
- Use `localStorage` for game state (nicknames and audio prefs only)

---

## Success Criteria

All of the following must be true before Phase 1 is considered done:

### Performance
- [ ] FCP < 1.5s on simulated 4G (Lighthouse mobile)
- [ ] JS bundle < 300KB gzipped
- [ ] Firebase move round-trip < 500ms (measured in DevTools)

### Functional
- [ ] vs AI: Easy, Medium, Hard all work correctly; Hard never loses
- [ ] Local 2P: both nicknames entered, pass-and-play works on mobile
- [ ] Online: two browser tabs can match, play a full game, and see results
- [ ] Disconnect: closing one tab causes the other to see a win after 30s
- [ ] Rematch: both players accept → new game starts with same sides
- [ ] Leave game: confirmation dialog appears before abandoning live online game
- [ ] Scores persist across page refresh (same nickname, same UID from localStorage)
- [ ] Matchmaking timeout: after 30s with no opponent, AI fallback offered
- [ ] Play with Friend: host creates game, gets shareable URL (`/game/{gameId}`), friend joins via link, game starts
- [ ] Shareable link: visiting `/game/{gameId}` as new user prompts nickname then joins the game
- [ ] Expired lobby: link older than 10min with no second player shows "Game expired" message

### UI / Feel
- [ ] X glyph draws on with stroke animation in Cyan; O in Rose — both with prominent glow
- [ ] Grid lines have subtle purple glow
- [ ] Win overlay shows confetti in winner's color with replay button
- [ ] Winning line pulses with intensified glow
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Board is perfectly square and centered on 375px, 768px, 1280px viewports

### Audio / Haptics
- [ ] `place.mp3` plays on every move
- [ ] `win.mp3`, `lose.mp3`, `draw.mp3` play on game end
- [ ] Music crossfades between home and game screens
- [ ] Mute button silences everything instantly
- [ ] Haptics fire on move placement; fail silently on desktop

### Service Layer
- [ ] No component, hook, or Zustand store imports from `firebase/*` SDK directly
- [ ] `src/lib/services/interfaces/` contains all 5 interface files with full type signatures
- [ ] `src/lib/services/index.ts` is the single DI binding point
- [ ] Swapping `gameService` in `index.ts` to a mock causes the full game flow to use the mock

### Firebase
- [ ] Exact online player count updates in real-time on home screen
- [ ] Scores (W/L/D) saved to Firestore and displayed in HUD
- [ ] Anonymous sign-in completes before any Firestore write
- [ ] Firestore rules reject writes to other players' documents

### Testing
- [ ] `vp test` passes with zero failures
- [ ] `src/lib/game/logic.ts` at 100% coverage
- [ ] `src/lib/ai/` at 100% coverage
- [ ] All 8 win conditions have explicit test cases

### Deployment
- [ ] `vp build` completes with zero errors or warnings
- [ ] App deployed to Vercel and accessible at `*.vercel.app`
- [ ] Firebase project configured with correct rules deployed

---

## Open Questions

None. All decisions resolved. See `PRD.md § 17 — Resolved Decisions`.

---

## Implementation Phases (high-level order)

This spec covers Phase 1 only. Implementation should proceed in this order to enable early testing at each step:

```
1. Foundation
   Vite+ scaffold → TypeScript config → Tailwind + CSS vars → Firebase init → routing skeleton

2. Core Game Logic (no UI)
   Board types → win detection → AI (easy/medium/hard) → unit tests → 100% coverage

3. Game UI (offline only)
   GameBoard → GlyphX/O → animations → WinOverlay → PlayerHUD → vs AI working end-to-end

4. Player Identity
   NicknameInput → localStorage persistence → Firebase Anonymous Auth → score read/write

5. Portal Home
   ParticleBackground → GameCard → OnlineCounter (mocked) → ModeSelect → full navigation flow

6. Audio + Haptics
   audioManager → Howler integration → all sound triggers → music crossfade → SettingsPanel

7. Online Multiplayer
   presence (RTDB) → matchmaking queue → real-time game sync → disconnect handling → rematch

8. Polish + Hardening
   Firestore security rules → edge cases → reduced-motion → loading/error states → Lighthouse audit

9. Deploy
   Vercel config → Firebase rules deploy → smoke test on real devices
```
