# Product Requirement Document

# NeonArena — Web Game Portal (Phase 1: TicTacToe)

---

## 1. Overview

**Product Name:** NeonArena (working title)  
**Phase:** 1 — TicTacToe  
**Future Phases:** Chess, Checkers, Battleship

### Brief Description

NeonArena is a dark-themed, neon-cyberpunk web game portal where players can compete in classic games solo, locally, or online against strangers — with no account required. Phase 1 ships TicTacToe as the flagship game. The portal is designed to be visually striking, addictive, and feel like a destination rather than a generic game site.

### Problem Statement

Existing browser-based TicTacToe and casual game portals are visually dated, clunky, and fail to create any emotional hook that makes players want to return. There is no high-quality, mobile-first, modern-looking free game portal that treats casual games as premium experiences.

### Product Vision

To build the most visually polished, dopamine-triggering casual game portal on the web — starting with TicTacToe — where every interaction feels satisfying, fast, and alive.

---

## 2. Goals & Objectives

| Goal                                          | Metric                      | Target                    |
| --------------------------------------------- | --------------------------- | ------------------------- |
| Players complete at least 2 games per session | Avg games per session       | ≥ 2                       |
| Players return within 7 days                  | 7-day retention rate        | ≥ 30%                     |
| Online matchmaking is fast                    | Median time to match        | < 10 seconds              |
| App feels premium                             | Qualitative / user feedback | Positive first impression |
| Portal loads fast                             | First Contentful Paint      | < 1.5s                    |

### Business Goals

- Establish NeonArena as a recognizable brand in casual web gaming
- Build a reusable portal foundation that future games plug into with minimal effort
- Grow organic traffic via word-of-mouth (shareable, unique design)

### User Goals

- Jump into a game instantly without friction (no signup)
- Feel the satisfaction of a beautifully crafted game experience
- Track wins over time (nickname-based persistence)
- Play against friends locally or strangers online

---

## 3. Assumptions

1. Firebase (Firestore + Realtime Database or Firestore with listeners) will handle both online player count and online multiplayer game state.
2. "No auth" means Firebase Anonymous Auth is used silently under the hood to give each session a UID — this is invisible to the user.
3. Nicknames are not globally unique; two players can share the same nickname. Scores are tied to Firebase Anonymous Auth UID + nickname.
4. Online 2-player matchmaking is random (no friend codes in Phase 1).
5. Haptics will use the [web-haptics](https://github.com/lochie/web-haptics) library; fallback gracefully on unsupported devices.
6. Background music is royalty-free and bundled or loaded from a CDN.
7. The "online players" counter is a global count across all games in the portal (not per-game in Phase 1).
8. A player who closes the tab mid-game is treated as a forfeit after a 30-second timeout.
9. Phase 1 ships only TicTacToe; other games appear on the portal home as "Coming Soon" cards.
10. Firebase is accessed exclusively via a service abstraction layer — no Firebase SDK calls in UI code. This makes the backend swappable (Supabase, PocketBase, custom server) by rewriting only the service implementations.

---

## 4. Scope

### In Scope (Phase 1)

- Game portal home page (arcade-style, animated)
- TicTacToe game with 4 modes:
  - Single Player (vs AI: Easy / Medium / Hard)
  - Local 2-Player (pass-and-play on same device)
  - Online Multiplayer (random matchmaking, anonymous)
  - Play with Friend (shareable link via gameId URL, e.g. `neonarena.app/game/abc123`)
- Nickname entry flow (per mode selection, no signup)
- Neon/cyberpunk visual theme with glow effects
- Fixed glow colors: X = Cyan (`#00F5FF`), O = Rose (`#FF2D78`)
- Firebase: online player count, score persistence, online game state
- Haptic feedback on moves (web-haptics library)
- Subtle UI sounds + background music with mute toggle + settings
- Win/draw/loss overlay with particle confetti + replay button
- Persistent scoreboard per nickname (W/L/D saved to Firebase)
- Responsive, mobile-first layout
- Vercel deployment
- "Coming Soon" cards for Chess, Checkers, Battleship

### Out of Scope (Phase 1)

- User accounts, email/password auth, social login
- Chess, Checkers, Battleship (gameplay)
- Chat or emotes during games
- Leaderboards (global ranking across all players)
- ELO / rating system
- Push notifications
- PWA / installable app
- Game replays

---

## 5. User Personas

### Persona 1 — The Casual Killer

- **Name:** Riya, 22, college student
- **Description:** Kills time between classes on her phone, plays casual games online
- **Goals:** Jump in fast, play a quick game, feel cool doing it
- **Pain Points:** Ugly, ad-riddled game sites; slow load times; forced signup

### Persona 2 — The Challenger

- **Name:** Arjun, 27, software developer
- **Description:** Plays during breaks, wants to beat the AI or challenge a stranger
- **Goals:** Test his skill, track his win rate, feel competitive
- **Pain Points:** AI is either too easy or unbeatable; no sense of progress

### Persona 3 — The Friend Group

- **Name:** Priya & Dev, couple at home
- **Description:** Want to play TicTacToe together on one phone (pass and play)
- **Goals:** Simple local 2-player that works on mobile without friction
- **Pain Points:** Most sites aren't optimized for mobile; confusing UIs

---

## 6. User Stories

---

**User Story 1 — Arcade Home**
As a new visitor,  
I want to land on an energetic, animated game portal homepage,  
So that I immediately feel like I've arrived somewhere worth staying.

**Acceptance Criteria:**

- Animated portal home loads in < 1.5s FCP
- TicTacToe card is prominently featured and clickable
- Chess, Checkers, Battleship cards show "Coming Soon" badge (non-clickable)
- Online player count is visible on the home screen
- Particle/scanline ambient effect plays in the background

---

**User Story 2 — Mode Selection**
As a player,  
I want to choose a game mode before entering my nickname,  
So that I know what I'm signing up for.

**Acceptance Criteria:**

- 4 mode cards shown: vs AI, Local 2P, Online Random, Play with Friend
- Each card has a descriptive label and icon
- Tapping a mode proceeds to nickname entry
- Selected mode is visually highlighted

---

**User Story 3 — Nickname Entry**
As a player,  
I want to enter a nickname before playing,  
So that my scores are saved to my name without creating an account.

**Acceptance Criteria:**

- Nickname input appears after mode selection
- Min 2, max 16 characters; alphanumeric + underscores only
- "Guest_XXXX" suggested as default
- Nickname saved to localStorage so returning users skip this step
- If playing local 2P, both players enter nicknames sequentially

---

**User Story 4 — vs AI Mode**
As a solo player,  
I want to play TicTacToe against an AI with selectable difficulty,  
So that I can practice or challenge myself.

**Acceptance Criteria:**

- 3 difficulty options shown: Easy, Medium, Hard
- Easy: AI plays randomly
- Medium: AI uses basic strategy (blocks wins, takes wins)
- Hard: AI uses minimax (unbeatable)
- AI move has a slight delay (300–600ms) to feel natural
- AI move triggers haptic + sound + glow animation

---

**User Story 5 — Online Multiplayer**
As a player,  
I want to be matched with a random online opponent instantly,  
So that I can play a real person without knowing them.

**Acceptance Criteria:**

- Player enters nickname → enters matchmaking queue
- "Searching for opponent..." shown with animated indicator + live queue count
- Match found within 10s under normal load; fallback: offer to play AI after 30s
- Game state synced via Firebase in real-time
- Opponent disconnection handled: 30s timeout → forfeit, player wins
- Rematch option after game ends (both players must accept)

---

**User Story 6 — Glowing Game Board**
As a player,  
I want the TicTacToe board to look and feel incredible,  
So that every move feels satisfying and premium.

**Acceptance Criteria:**

- Grid lines have subtle cyan/purple glow (box-shadow or SVG filter)
- X marks render in Cyan (`#00F5FF`) with strong glow on placement
- O marks render in Rose (`#FF2D78`) with strong glow on placement
- Placement triggers: haptic (web-haptics) + sound + CSS scale animation
- Winning line animates with intensified glow pulse
- Board is perfectly square and centered on all screen sizes

---

**User Story 7 — Win/Loss/Draw Moment**
As a player,  
I want a dramatic, satisfying end-game screen,  
So that winning feels rewarding and I'm motivated to play again.

**Acceptance Criteria:**

- Full-screen overlay appears on game end
- Winner's color confetti/particles burst across the screen
- Large text: "YOU WIN", "YOU LOSE", or "DRAW"
- Score updated in the overlay (W/L/D tally)
- Two buttons: "Play Again" (same mode/opponent) and "Home"
- Overlay dismissible; auto-dismisses after 8s if no action

---

**User Story 8 — Score Persistence**
As a returning player,  
I want my win/loss/draw record to persist across sessions,  
So that I can track my progress over time.

**Acceptance Criteria:**

- Scores tied to Firebase Anonymous UID + nickname
- Displayed as W / L / D in the game HUD
- Score persists across page refreshes and return visits (via localStorage UID recovery)
- Score resets only if player manually clears their nickname

---

**User Story 9 — Sound & Haptics**
As a player,  
I want satisfying audio and haptic feedback,  
So that every interaction feels tactile and alive.

**Acceptance Criteria:**

- Sounds: tile placement tap, win chime, lose buzz, draw tone, background music loop
- Background music loops seamlessly; volume lower than UI sounds
- Settings panel: master toggle, separate sliders for SFX and Music
- Mute button always visible in game HUD (one tap)
- Haptics fire on: tile placement, win, button press (via web-haptics)
- Haptics fail silently on unsupported devices

---

**User Story 10 — Online Player Count**
As a visitor,  
I want to see how many players are online right now,  
So that the portal feels alive and active.

**Acceptance Criteria:**

- Counter visible on home screen and in-game header
- Updates in real-time via Firebase presence system
- Shows "🟢 N players online" format
- Gracefully shows last known count if Firebase connection drops

---

## 7. Functional Requirements

### Feature: Portal Home

- Display arcade-style animated home with particle/ambient background effect
- Game cards rendered in a responsive grid (1 col mobile, 2–3 col desktop)
- TicTacToe card: active, animated, clickable
- Other game cards: "Coming Soon" badge, non-interactive, slightly dimmed
- Global online player count displayed prominently
- Clicking a game card navigates to mode selection for that game

### Feature: Mode Selection

- 4 mode options for TicTacToe: vs AI, Local 2-Player, Online Random, Play with Friend
- Each mode card has: icon, title, short description
- Selecting a mode stores it in session state and navigates to nickname entry
- Back button returns to home

### Feature: Nickname Entry

- Single text input (or two sequential inputs for Local 2P)
- Validation: 2–16 chars, alphanumeric + underscore, no spaces
- Default suggestion: `Guest_` + 4 random digits
- On submit: nickname stored in localStorage; Firebase Anonymous Auth sign-in triggered silently
- For Local 2P: Player 1 enters nickname → Player 2 enters nickname → game starts

### Feature: TicTacToe Game Board

- 3×3 grid, SVG or CSS-based
- Grid lines: subtle neon glow (opacity ~40%, `#7B61FF` purple-ish)
- X glyph: cyan `#00F5FF`, thick stroke, animated draw-on effect
- O glyph: rose `#FF2D78`, thick stroke, animated draw-on effect
- Both glyphs have prominent drop-shadow glow on render
- Tap/click a cell: places glyph + haptic + sound + scale pop animation
- Occupied cells: not re-clickable; visual affordance (cursor: not-allowed)
- Whose-turn indicator: top of board, highlights active player's color
- Game HUD: player nicknames, W/L/D scores, mute button, home button

### Feature: AI Engine

- Difficulty stored in session state
- Easy: `Math.random()` cell selection from available cells
- Medium: check for immediate win → check for immediate block → else random
- Hard: full minimax with alpha-beta pruning (deterministic, unbeatable)
- AI move fires after 300–600ms artificial delay
- AI move triggers same animation/haptic/sound as human move

### Feature: Online Multiplayer

- On entering matchmaking: write player document to Firestore `queue` collection
- Firebase Cloud Function or client-side listener pairs two queued players into a `game` document
- Game document structure: `gameId`, `playerX` (UID, nickname), `playerO` (UID, nickname), `board` (array[9]), `currentTurn` (UID), `status` (waiting/active/finished), `winner`
- Each move: client writes move to Firestore; opponent listens via `onSnapshot`
- Turn validation: client must check it is their turn before allowing a move
- Disconnect handling: `onDisconnect` sets a `disconnectedAt` timestamp; opponent client detects after 30s and claims win
- Rematch: both players must write `rematch: true` to game document; new game document created

### Feature: Play with Friend (Shareable Link)

- Player selects "Play with Friend" mode → enters nickname → a new game document is created in Firestore
- Game URL format: `neonarena.app/game/{gameId}` — displayed with a one-tap copy button
- Host waits on the game screen with a "Waiting for friend..." state
- Friend opens the link → enters nickname → is assigned the opponent role (O) → game starts immediately
- If friend joins while host has already left: show "Host left" message, offer to return home
- Game proceeds identically to Online Random mode (same Firestore real-time sync, disconnect handling, rematch)
- Rematch: generates a new gameId URL; host shares again (or same URL redirects to new game if both accept)
- Link expires after 10 minutes if no second player joins (game doc status → `expired`)

### Feature: Win Detection

- Check all 8 win conditions after every move (3 rows, 3 cols, 2 diagonals)
- On win: highlight winning line with intensified glow pulse animation → show end overlay
- On draw (board full, no winner): show draw overlay
- Win/draw/loss written to Firebase score document for both players

### Feature: Scoreboard / Score Persistence

- Firestore collection: `scores/{uid}` → `{ nickname, wins, losses, draws, updatedAt }`
- Score fetched on game start, displayed in HUD
- Score updated at game end (increment appropriate counter)
- Displayed format: `W: 12 | L: 4 | D: 3`

### Feature: Sound System

- Audio manager singleton initialized on first user interaction (browser autoplay policy)
- Sounds: `place.mp3`, `win.mp3`, `lose.mp3`, `draw.mp3`, `bg-music.mp3`, `click.mp3`
- Settings: master mute toggle (persisted to localStorage), SFX volume, Music volume
- Mute FAB always visible in-game
- Settings accessible via gear icon on home and in-game

### Feature: Haptics

- Use `web-haptics` library
- Trigger patterns:
  - Cell placement: short pulse (50ms)
  - Win: triple pulse
  - Button tap: 20ms tap
- Wrap all calls in try/catch; fail silently if unsupported

### Feature: Online Player Count

- Firebase Realtime Database presence pattern: each connected client writes to `/presence/{uid}`
- Home screen listens to `/presence` child count in real-time
- Display: `🟢 {N} players online`
- In-game: shown in header, smaller size

---

## 8. User Flows

### Flow 1: Solo vs AI

```
Open app
→ Animated arcade home loads
→ Click TicTacToe card
→ Mode selection screen: choose "vs AI"
→ Difficulty selection: Easy / Medium / Hard
→ Nickname entry (pre-filled if returning)
→ Game board loads
→ Player moves (haptic + sound + glow)
→ AI responds after delay (haptic + sound + glow)
→ Game ends → confetti overlay
→ "Play Again" or "Home"
```

### Flow 2: Local 2-Player

```
Open app → TicTacToe → "Local 2P"
→ Player 1 enters nickname → Player 2 enters nickname
→ Game board loads (Player 1 = X/Cyan, Player 2 = O/Rose)
→ Pass-and-play: active player sees their turn indicator
→ Game ends → confetti overlay with winner's name
→ "Play Again" or "Home"
```

### Flow 3: Online Random Match

```
Open app → TicTacToe → "Online Random"
→ Nickname entry
→ Matchmaking screen: "Searching for opponent..." + animated indicator
→ Matched → game starts (role assigned: X or O)
→ Real-time game play
→ Game ends → overlay with rematch option
→ Both accept → new game | Either declines → home
→ If no match in 30s → offer "Play vs AI instead"
```

### Flow 4: Play with Friend

```
Open app → TicTacToe → "Play with Friend"
→ Nickname entry
→ Game created in Firestore → unique URL generated
→ Host sees: board (locked) + shareable link + "Waiting for friend..."
→ Host copies link, sends to friend via WhatsApp/DM/etc.
→ Friend opens link → enters nickname → joins as O
→ Game starts — both players see the live board
→ Game ends → overlay with rematch option
→ Rematch → new gameId → host reshares (or auto-redirect)
```

### Flow 5: Returning Player

```
Open app
→ Home loads (nickname from localStorage detected)
→ Scores pre-fetched from Firebase in background
→ Select game + mode → skip nickname entry (use saved)
→ Play
```

---

## 9. Firebase / API Requirements

### Firestore Collections

| Collection | Document   | Fields                                                                                                                              |
| ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `queue`    | `{uid}`    | `uid`, `nickname`, `joinedAt`, `status` (waiting/matched)                                                                           |
| `games`    | `{gameId}` | `playerX {uid, nickname}`, `playerO {uid, nickname}`, `board [9]`, `currentTurn`, `status`, `winner`, `createdAt`, `disconnectedAt` |
| `scores`   | `{uid}`    | `nickname`, `wins`, `losses`, `draws`, `updatedAt`                                                                                  |

### Realtime Database

| Path              | Value                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `/presence/{uid}` | `{ nickname, connectedAt }` — entry removed automatically via `onDisconnect` on tab close |

### Client Operations

| Operation             | Trigger            | Target                           |
| --------------------- | ------------------ | -------------------------------- |
| Anonymous sign-in     | Nickname submit    | Firebase Auth                    |
| Write to queue        | Enter matchmaking  | Firestore `queue/{uid}`          |
| Listen to game doc    | Game starts        | Firestore `games/{gameId}`       |
| Write move            | Player taps cell   | Firestore `games/{gameId}.board` |
| Update score          | Game ends          | Firestore `scores/{uid}`         |
| Write presence        | App load           | RTDB `/presence/{uid}`           |
| Listen presence count | Home screen active | RTDB `/presence`                 |

---

## 10. Data Models

### Game Board

```
board: Array[9]  // indices 0–8, left-to-right, top-to-bottom
values: null | "X" | "O"
```

### Score Document

| Field       | Type      | Description            |
| ----------- | --------- | ---------------------- |
| `uid`       | string    | Firebase Anonymous UID |
| `nickname`  | string    | Display name           |
| `wins`      | number    | Total wins             |
| `losses`    | number    | Total losses           |
| `draws`     | number    | Total draws            |
| `updatedAt` | timestamp | Last updated           |

### Game Document

| Field            | Type                      | Description                                             |
| ---------------- | ------------------------- | ------------------------------------------------------- |
| `gameId`         | string                    | Auto-generated Firestore ID                             |
| `playerX`        | `{uid, nickname}`         | X player                                                |
| `playerO`        | `{uid, nickname}` or null | O player (null until friend joins)                      |
| `board`          | Array[9]                  | Current board state (`null` \| `'X'` \| `'O'`)          |
| `currentTurn`    | string                    | UID of player whose turn it is                          |
| `status`         | enum                      | `waiting`, `active`, `finished`, `abandoned`, `expired` |
| `winner`         | string / null             | UID of winner, `"draw"`, or null                        |
| `createdAt`      | timestamp                 | Game creation time                                      |
| `expiresAt`      | timestamp                 | 10 min after `createdAt`; friend-lobby only             |
| `disconnectedAt` | timestamp / null          | Set `onDisconnect`; triggers 30s forfeit check          |
| `rematch`        | `Record<uid, boolean>`    | Both must be `true` to trigger rematch                  |

---

## 11. UI/UX Requirements

### Design Language

- **Theme:** Dark, neon-cyberpunk
- **Background:** Near-black `#0A0A0F` with subtle particle/ambient animation
- **Primary accent:** Cyan `#00F5FF` (X glyph, CTAs)
- **Secondary accent:** Rose `#FF2D78` (O glyph, highlights)
- **Tertiary accent:** Purple `#7B61FF` (grid lines, UI borders)
- **Font:** A geometric sans-serif (e.g. `Orbitron` for headings, `Inter` for body)
- **Glow technique:** CSS `filter: drop-shadow()` + `box-shadow` for UI; SVG filters for glyphs

### Layout

- Mobile-first: base layout designed for 375px viewport
- Breakpoints: 375px (base), 768px (tablet), 1280px (desktop)
- Game board: always square, max 480px, centered with `aspect-ratio: 1`
- Home grid: 1 col mobile → 2 col tablet → 3 col desktop

### Components Required

1. `GameCard` — home portal card with animated thumbnail + coming soon badge
2. `ModeSelector` — 4-option mode selection cards
3. `NicknameInput` — styled input with validation
4. `GameBoard` — 3×3 TicTacToe grid with glow lines
5. `GlyphX` / `GlyphO` — animated SVG glyphs with glow
6. `PlayerHUD` — top bar: nicknames, scores, turn indicator, mute, home
7. `WinOverlay` — full screen, confetti, result text, CTA buttons
8. `MatchmakingScreen` — searching animation, queue count, timeout fallback
9. `SettingsPanel` — slide-in drawer: sound/music sliders, mute toggle
10. `OnlineCounter` — live presence badge

### Animations

- Home: ambient particle drift, game card hover glow intensify
- Glyph placement: draw-on stroke animation (200ms) + scale pop (1.0 → 1.15 → 1.0)
- Winning line: pulse glow animation (infinite until overlay)
- Win overlay: confetti particles burst in winner's color
- Matchmaking: pulsing radar/sonar circle animation

### Accessibility

- All interactive elements have focus states
- Color is not the only differentiator (X/O also differ by shape)
- Mute button always reachable
- `prefers-reduced-motion`: disable non-essential animations

---

## 12. Non-Functional Requirements

### Performance

- First Contentful Paint: < 1.5s on 4G mobile
- Firebase game move round-trip: < 500ms
- Bundle size: < 300KB gzipped (lazy-load game modules)
- Audio files: < 50KB each, preloaded after first interaction

### Security

- Firestore rules: players can only write to `games` documents they are a participant in
- Players can only write to `scores/{their own UID}`
- Queue: players can only write/delete their own queue entry
- No sensitive data stored client-side beyond UID + nickname

### Scalability

- Firebase Firestore scales automatically; no infrastructure management needed in Phase 1
- Matchmaking is client-side listener based; revisit with Cloud Functions at scale (1000+ concurrent)

### Reliability

- Offline detection: show "Connection lost" banner; disable moves
- Firebase reconnect: automatic; game state re-synced on reconnect
- Graceful degradation: if Firebase unavailable, local modes (vs AI, Local 2P) still work

---

## 13. Edge Cases

| Scenario                                      | Handling                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| Player disconnects mid-game                   | 30s timer → opponent wins, overlay shown                                         |
| Both players disconnect simultaneously        | Game document marked `abandoned`; no score change                                |
| Two players enter same nickname               | Allowed (scores tied to UID, not nickname)                                       |
| Player clears localStorage                    | New anonymous UID assigned; fresh score record created                           |
| AI makes move on full board                   | Impossible by game logic; guarded with assertion                                 |
| Browser tab backgrounded during online game   | Firebase connection maintained; move valid on return                             |
| Matchmaking queue has only 1 player after 30s | Prompt: "No opponent found — play vs AI?"                                        |
| Rapid double-tap on cell                      | First tap registers; cell locked immediately, subsequent taps ignored            |
| Sound autoplay blocked by browser             | Audio manager initialized on first user gesture; silent until then               |
| Haptics not supported                         | `try/catch` around all haptic calls; fail silently                               |
| Invalid board state written to Firestore      | Client validates board before writing; Firestore rules reject out-of-turn writes |

---

## 14. Analytics & Tracking

Use Firebase Analytics (or a lightweight custom event logger to Firestore).

| Event                  | Trigger                            | Properties                                         |
| ---------------------- | ---------------------------------- | -------------------------------------------------- |
| `app_open`             | App loads                          | `platform`, `returning_user`                       |
| `mode_selected`        | Mode card tapped                   | `mode` (ai/local/online)                           |
| `game_started`         | Game board renders                 | `mode`, `ai_difficulty`                            |
| `move_made`            | Cell tapped                        | `mode`, `move_number`, `player`                    |
| `game_ended`           | Win/loss/draw detected             | `mode`, `result`, `move_count`, `duration_seconds` |
| `rematch_accepted`     | Rematch confirmed                  | `mode`                                             |
| `sound_toggled`        | Mute/unmute                        | `state` (muted/unmuted)                            |
| `matchmaking_timeout`  | 30s with no match                  | —                                                  |
| `ai_fallback_accepted` | Player accepts AI after timeout    | —                                                  |
| `friend_game_created`  | Host creates Play with Friend game | `gameId`                                           |
| `friend_link_copied`   | Host taps copy link button         | `gameId`                                           |
| `friend_game_joined`   | Friend joins via shareable link    | `gameId`                                           |
| `friend_lobby_expired` | Link expires with no second player | `gameId`                                           |

---

## 15. Release Plan

### MVP (Phase 1 Launch)

- [ ] Portal home with arcade UI + Coming Soon cards
- [ ] TicTacToe: vs AI (Easy/Medium/Hard)
- [ ] TicTacToe: Local 2-Player
- [ ] TicTacToe: Online Random Matchmaking
- [ ] Nickname entry + Firebase score persistence
- [ ] Neon/cyberpunk visual theme + glyph animations
- [ ] Win/loss overlay with confetti
- [ ] Sound system (SFX + music) with settings
- [ ] Haptics (web-haptics)
- [ ] Online player count (Firebase presence)
- [ ] Vercel deployment (default vercel.app domain; custom domain post-launch) + Firebase project setup

### Phase 2

- Chess (with AI via chess.js + stockfish wasm)
- Private room codes for online play
- Global leaderboard

### Phase 3

- Checkers
- Battleship (turn-based async)
- PWA / installable
- ELO rating system

---

## 16. Risks & Mitigations

| Risk                                   | Likelihood        | Impact | Mitigation                                                                      |
| -------------------------------------- | ----------------- | ------ | ------------------------------------------------------------------------------- |
| Firebase costs spike with high usage   | Medium            | High   | Set Firebase budget alerts; optimize Firestore reads with caching               |
| Matchmaking fails at low player counts | High (early days) | Medium | Show AI fallback after 30s; "Coming Soon" creates anticipation to drive traffic |
| web-haptics library not maintained     | Low               | Low    | Wrap in abstraction layer; can swap for `navigator.vibrate` fallback            |
| Audio autoplay blocked                 | High              | Low    | Defer audio init to first gesture; show subtle "tap to enable sound" hint       |
| Cheating in online mode                | Medium            | Medium | Server-side move validation via Firestore rules (turn enforcement)              |
| AI difficulty feels unfair             | Medium            | Medium | Playtest each difficulty; tune Medium to ~60% win rate for average player       |

---

## 17. Resolved Decisions

All open questions answered and locked in:

| #   | Question                   | Decision                                                                                                                |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | App name                   | "NeonArena" is a working title; final name TBD before launch                                                            |
| 2   | Custom domain              | Vercel default domain at launch; custom domain added post-launch                                                        |
| 3   | Rematch in online mode     | Same sides — roles do NOT swap; new game document created                                                               |
| 4   | Score reset                | No score reset in Phase 1                                                                                               |
| 5   | Online player count        | Exact count displayed                                                                                                   |
| 6   | Leave game                 | Yes — confirmation dialog before abandoning a live online game                                                          |
| 7   | Music tracks               | Multiple tracks; music changes between home screen and in-game                                                          |
| 8   | Accessibility              | Best-effort WCAG AA (not a hard requirement)                                                                            |
| 9   | Frontend toolchain         | **Vite+** — VoidZero unified toolchain (`vp` CLI) wrapping Vite, Vitest, Oxlint, Oxfmt, Rolldown                        |
| 10  | Online multiplayer backend | Firebase (Firestore) — turn-based games don't need WebSockets/Yjs                                                       |
| 11  | Play with Friend           | Shareable link — `neonarena.app/game/{gameId}` with one-tap copy                                                        |
| 12  | Backend portability        | Service layer (adapter pattern) — Firebase hidden behind interfaces; swap provider by changing `services/index.ts` only |
