# Implementation Plan: Design Overhaul — Homepage + TicTacToe Flow

## Overview

A three-phase visual design pass across four pages and their shared components. Phase 1 fixes layout and visual hierarchy (/arrange). Phase 2 adds meaningful motion (/animate). Phase 3 layers in personality and delight (/delight). Each phase leaves the app in a fully working state.

## Architecture Decisions

- **Framer Motion only** — no GSAP. All enter/exit animations use `motion.`\* variants and `AnimatePresence`.
- **CSS keyframes for micro-animations** — one-shot effects (glow burst, blink, draw) live in `animations.css`, not inline JS.
- **Design tokens only** — spacing uses `--na-space-`_, colours use `--na-_` variables. No raw hex or arbitrary px values in TSX.
- `**useReducedMotion` respected throughout\*\* — every new animation must check the existing hook before applying.
- **No structural refactors** — these are visual-only changes. State logic, routing, and game engine are untouched.

---

## Task List

### Phase 1 — /arrange (Layout & Visual Hierarchy) ✅ **Done**

- [x] **Task 1: Homepage layout & typographic hierarchy**
      **Description:** The hero left column (`max-w-[28rem]`) vs the right column (settings button + OnlineCounter) currently feels imbalanced — the right column is visually thin. The `"Insert coin"` label at `Home/index.tsx:96` is `text-[11px]` with `tracking-[0.42em]` but sits too close to the h1. The "Live floor / Games" section heading before the grid (`index.tsx:146-158`) doubles up on similar muted labels without clear hierarchy.
      **Acceptance criteria:**
  - Hero left/right column visual weight is balanced (right side has enough presence at `lg:` breakpoint)
  - `"Insert coin"` label, h1 `NEON ARENA`, and subtitle have three visually distinct hierarchy levels (size, weight, spacing)
  - Spacing between "Insert coin" → h1 → subtitle uses `--na-space-`\* tokens or consistent scale steps, not arbitrary `mt-3 / mt-4`
  - "Live floor" / "Games" section heading hierarchy is clear — one is a label, one is a heading
  - Game card grid maintains rhythm at `md:` and `xl:` breakpoints
    **Verification:**
  - Visit `http://localhost:5174/` at desktop (1440px) and mobile (375px widths)
  - Visually confirm three-level hero type hierarchy is readable
    **Dependencies:** None
    **Files:**
  - `src/pages/Home/index.tsx`
  - `src/components/GameCard/index.tsx`
    **Estimated scope:** S

---

- [x] **Task 2: ModeSelect layout & hierarchy**
      **Description:** The page label `"Tic Tac Toe"` (purple, 11px, `tracking-[0.38em]`) and h1 `"Choose mode"` are in the same `border-l-2` block as the homepage hero — consistent, but the label/heading gap (`mt-3`) and subtitle gap (`mt-4`) match the homepage exactly, making pages feel identical. The difficulty panel that opens under the VS AI card (`mt-4`, `px-5 py-5`) needs clearer visual grouping from the card itself. Back link at the bottom is low-contrast.
      **Acceptance criteria:**
  - Page label, h1, and subtitle have distinct visual separation from the homepage equivalents (different proportions or spacing rhythm)
  - Difficulty pill panel is visually grouped with the VS AI card (inset/indented treatment, not a floating equal peer)
  - 4 mode cards have consistent gap between them
  - Back link has adequate contrast and is not crowded by the card list
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe`
  - Click VS AI — confirm difficulty panel feels attached to its card
  - Check back link visibility
    **Dependencies:** None
    **Files:**
  - `src/pages/ModeSelect/index.tsx`
  - `src/components/ModeCard/index.tsx`
    **Estimated scope:** S

---

- [x] **Task 3: NicknameEntry layout & form spacing**
      **Description:** The step counter `"Step 1 of 2"` (`NicknameEntry/index.tsx:177-183`) is a `<p>` with `mt-6` — it appears below the heading block but has no visual distinction from the mode context line above it. The NicknameInput component (`NicknameInput/index.tsx`) has no character counter (maxLength is 24 but never surfaced). The Continue/Back buttons in the `mt-auto` block feel detached from the input field.
      **Acceptance criteria:**
  - Step counter has a clearly distinct visual treatment from the mode context line (different colour, size, or separator)
  - `NicknameInput` shows a character count indicator (e.g. `12 / 24`) that appears when focused or near limit
  - Input field and button group have breathing room — adequate vertical gap between them
  - Continue and Back buttons are proportionally sized — Continue is primary-weight, Back is secondary
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe/nickname?mode=local`
  - Confirm step counter reads distinctly; type to 24 chars and confirm limit indicator appears
    **Dependencies:** None
    **Files:**
  - `src/pages/NicknameEntry/index.tsx`
  - `src/components/NicknameInput/index.tsx`
    **Estimated scope:** S

---

- [x] **Task 4: GamePage — PlayerHUD, board, and action bar**
      **Description:** `PlayerHUD` renders as a `<header>` with `mb-6 border-b pb-4` — the bottom border is the only separator, making the HUD feel thin. Player names are `text-sm` inline, score is `text-xs` — both are too small relative to the game board below. `GameBoard` has `max-w-[480px]` while the parent `GamePage` container is `max-w-lg` (512px) — they are close but not explicitly aligned. The HUD action buttons (settings, mute, Home) are in a plain `flex gap-2` row with no visual grouping.
      **Acceptance criteria:**
  - PlayerHUD has a more substantial presence — player names are legible at a glance (larger or bolder)
  - Score line `W: X | L: X | D: X` is visually distinct from player names (label vs data separation)
  - `GameBoard` max-width explicitly matches or intentionally differs from HUD container width
  - Action buttons (settings, mute, Home) have clear visual grouping separate from player info
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe/game?mode=local`
  - Play a move and confirm board/HUD alignment looks intentional
  - Confirm score is readable without squinting
    **Dependencies:** None
    **Files:**
  - `src/pages/Game/index.tsx`
  - `src/components/PlayerHUD/index.tsx`
  - `src/components/GameBoard/index.tsx`
    **Estimated scope:** M

---

### Checkpoint 1 — After Phase 1 ✅

- All 4 pages have visibly improved layout compared to before
- No layout regressions at mobile (375px) or desktop (1440px)
- `http://localhost:5174/` loads cleanly, game board is square, forms are usable

---

### Phase 2 — /animate (Motion & Transitions) ✅ **Done**

- [x] **Task 5: Homepage entrance animations & card hover**
      **Description:** The homepage already has Framer Motion entrance animations on the hero (`opacity 0→1, x -18→0`) and card grid (stagger 0.08s, `y 22→0`). These are functional but flat — the hero animates as one block rather than staggering label → h1 → subtitle. `GameCard` `whileHover` only changes `boxShadow` and `borderColor` — no scale or thumbnail movement.
      **Acceptance criteria:**
  - Hero text staggers: `"Insert coin"` label first, then h1, then subtitle, with distinct delays (~60ms apart)
  - `GameCard` hover adds a subtle upward lift (`y: -3`) alongside the existing glow
  - `"Insert coin"` has a subtle looping animation (slow blink or scanline shimmer — CSS keyframe in `animations.css`)
  - `prefers-reduced-motion`: stagger collapses to instant, blink/shimmer is suppressed
    **Verification:**
  - Hard-refresh `http://localhost:5174/` and observe hero entrance stagger
  - Hover over the Tic Tac Toe card — confirm lift + glow together
  - Enable reduced motion in OS settings, refresh — confirm no stagger, no blink
    **Dependencies:** Task 1
    **Files:**
  - `src/pages/Home/index.tsx`
  - `src/components/GameCard/index.tsx`
  - `src/styles/animations.css`
    **Estimated scope:** S

---

- [x] **Task 6: ModeSelect entrance & selection animations**
      **Description:** Mode cards enter with `staggerChildren: 0.07` and `y: 14→0` — subtle but acceptable. The `selected` state on `ModeCard` transitions via CSS `transition-colors` only — no spring or motion feedback. The difficulty panel reveal uses `height: 0 → "auto"` with `duration: 0.32` but `overflow` is not clipped during the expand, causing a flash.
      **Acceptance criteria:**
  - Mode card selection triggers a Framer Motion spring that reinforces the `aria-pressed` state change (brief scale or border glow transition)
  - Difficulty panel height expand clips overflow correctly — no content flash before the panel fully opens
  - Page entrance stagger delay is tuned to feel snappy, not sluggish (current 0.07s × 4 = 280ms total — verify or tighten)
  - `prefers-reduced-motion`: selection feedback is instant, panel opens without animation
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe`
  - Click VS AI — observe spring on selection + smooth panel expand
  - Click Local 2P — confirm VS AI deselects cleanly
    **Dependencies:** Task 2
    **Files:**
  - `src/pages/ModeSelect/index.tsx`
  - `src/components/ModeCard/index.tsx`
    **Estimated scope:** S

---

- [x] **Task 7: NicknameEntry step transition & input focus**
      **Description:** The step 1 → step 2 transition in `NicknameEntry` is currently handled by changing `value`/`setValue`/`label` state — the UI re-renders in place with no positional animation. The `NicknameInput` focus glow is a CSS `transition-[border-color,box-shadow]` (instant on tab-in). The Continue button has no press animation.
      **Acceptance criteria:**
  - Step transition (0 → 1) animates the form content: current step slides out left, next step slides in from the right, using `AnimatePresence` keyed on `localStep`
  - Input focus glow uses a short Framer Motion variant (or CSS transition with longer duration) so the cyan ring fades in over ~150ms, not snapping
  - Continue button has a `whileTap` spring scale down and back
  - `prefers-reduced-motion`: step transition is instant (no slide), focus still changes colour
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe/nickname?mode=local`
  - Enter P1 nickname → click Continue — observe slide transition
  - Tab into input — observe glow fade-in
    **Dependencies:** Task 3
    **Files:**
  - `src/pages/NicknameEntry/index.tsx`
  - `src/components/NicknameInput/index.tsx`
    **Estimated scope:** S

---

- [x] **Task 8: GamePage — turn indicator, mark placement, score counter**
      **Description:** The turn indicator in `PlayerHUD` is currently just a colour change: active player is cyan/rose, inactive is `--na-text-muted`. There is no transition between turns. The `CellGlyph` draw animation (SVG stroke-dashoffset) is already in place via `GlyphX`/`GlyphO` — but the cell button itself has no entrance. Score W/L/D values are static text — they don't animate on increment.
      **Acceptance criteria:**
  - Active player name has a `layoutId`-based or `AnimatePresence` crossfade so the `(turn)` indicator transitions smoothly on turn change
  - Cell button wrapper gets a Framer Motion `scale: 0.85 → 1` spring on mark placement (wraps the existing `CellGlyph`)
  - Score numbers animate up on increment using a simple `motion.span` with `key={value}` so each new number slides up in
  - `prefers-reduced-motion`: all three are instant
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe/game?mode=local`
  - Make several moves — observe cell spring-in and turn indicator crossfade
  - Win a game — observe score counter tick up
    **Dependencies:** Task 4
    **Files:**
  - `src/components/PlayerHUD/index.tsx`
  - `src/components/GameBoard/index.tsx`
    **Estimated scope:** M

---

### Checkpoint 2 — After Phase 2 ✅

- All 4 pages have meaningfully enhanced motion
- `prefers-reduced-motion` verified in browser accessibility settings — no animations fire
- No janky/clashing animations between pages (navigate through the full flow once)

---

### Phase 3 — /delight (Personality & Joy) ✅ **Done**

- [x] **Task 9: Homepage — "Insert coin" arcade prompt & card personality**
      **Description:** `"Insert coin"` at `Home/index.tsx:96` is static decorative copy. It should feel like a real arcade CRT prompt. The `TicTacToeThumb` SVG in the hero card is static — on hover it could preview the game glyphs.
      **Acceptance criteria:**
  - `"Insert coin"` has a looping blink — the text or a trailing cursor blinks on/off at ~1.1s intervals (CSS `@keyframes insert-coin-blink` in `animations.css`)
  - The blink honours `prefers-reduced-motion` (static when reduced)
  - `TicTacToeThumb` animates its X/O glyphs on `GameCard` hover — the existing SVG lines draw or glow on `whileHover`
  - At least one additional delight touch on the hero (e.g. `ParticleBackground` density increase near hero, or a subtle scanline overlay on the header)
    **Verification:**
  - Visit `http://localhost:5174/` — observe "Insert coin" blinking
  - Hover the Tic Tac Toe card — observe glyph animation
    **Dependencies:** Task 5
    **Files:**
  - `src/pages/Home/index.tsx`
  - `src/components/GameCard/index.tsx`
  - `src/styles/animations.css`
  - `src/styles/globals.css` (if scanline token or layer needed)
    **Estimated scope:** S

---

- [x] **Task 10: ModeSelect — mode card icon personality**
      **Description:** The 4 mode card icons (`IconVsAi`, `IconLocal`, `IconOnline`, `IconFriend`) are static SVGs. On hover they could express their personality. Selected state currently just changes border/text colour — it could feel more celebratory.
      **Acceptance criteria:**
  - At least 2 of the 4 icons animate on `ModeCard` hover (e.g. VS AI brain eyes blink, Local icon pair bounces apart, Online globe rotates a degree, Friend card plus-icon pulses)
  - Selected `ModeCard` adds a brief glow burst on the icon container when transitioning to selected state (using `AnimatePresence` or `motion` key change)
  - Animations are scoped to the icon — no layout shift on the card itself
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe`
  - Hover each card — at least 2 icons animate
  - Click VS AI — observe selection glow burst on icon
    **Dependencies:** Task 6
    **Files:**
  - `src/pages/ModeSelect/index.tsx`
  - `src/components/ModeCard/index.tsx`
    **Estimated scope:** S

---

- [x] **Task 11: NicknameEntry — validation reward & character limit indicator**
      **Description:** When a valid nickname is entered, there is no positive feedback — the Continue button simply becomes enabled. The 24-char `maxLength` is enforced by the input but never shown. The character limit indicator added in Task 3 needs a delight touch.
      **Acceptance criteria:**
  - When `isNicknameValid(value)` first becomes true, a checkmark icon or glow reward appears next to the input with a brief draw/scale animation
  - Character counter (added in Task 3) changes colour as the user approaches the limit: muted → warning (rose) at ≥ 20 chars
  - At exactly 24 chars (maxLength hit), the counter pulses rose once to signal the cap
  - All delight touches honour `prefers-reduced-motion`
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe/nickname?mode=local`
  - Type a valid name → observe checkmark/glow
  - Type to 20, 22, 24 chars → observe counter colour transition and cap pulse
    **Dependencies:** Task 7
    **Files:**
  - `src/components/NicknameInput/index.tsx`
  - `src/styles/animations.css`
    **Estimated scope:** S

---

- [x] **Task 12: GamePage — mark glow burst, cascading win shimmer, WinOverlay polish**
      **Description:** Mark placement: `CellGlyph` has an `animate` state (450ms) but the cell background has no burst effect. Win cells: `glow-pulse-win` applies `animation: glow-pulse-win 1.2s ease-in-out infinite` to all 3 winning cells simultaneously — they all pulse together. WinOverlay: the confetti fires from a single emitter at `position: { x: 50, y: 32 }` and is one colour + white.
      **Acceptance criteria:**
  - When a mark is placed, the cell background briefly flashes with a `var(--na-glow-x)` or `var(--na-glow-o)` burst (CSS keyframe `@keyframes cell-place-burst`) that fades in 300ms
  - Winning cells cascade their pulse: cell 0 starts at `animation-delay: 0ms`, cell 1 at `80ms`, cell 2 at `160ms` — `winLine` index order drives the delay
  - WinOverlay confetti fires from two emitters (left 25% + right 75%) and uses a 3-colour palette (brand colour + white + `--na-purple` hex)
  - All three honour `prefers-reduced-motion` (burst is instant/removed, cascade is simultaneous, confetti is suppressed — already is via `showParticles`)
    **Verification:**
  - Visit `http://localhost:5174/play/tictactoe/game?mode=local`
  - Place a mark — observe cell flash
  - Win a game — observe cascading win pulse, then WinOverlay confetti from two positions
    **Dependencies:** Task 8
    **Files:**
  - `src/components/GameBoard/index.tsx`
  - `src/components/WinOverlay/index.tsx`
  - `src/styles/animations.css`
    **Estimated scope:** M

---

### Checkpoint 3 — Final Verification ✅

- All 4 pages feel distinctly better than before the overhaul
- No console errors on any page
- Keyboard navigation works: board cells navigable by arrow/tab, form inputs focusable
- Full golden path end-to-end:
  1. `http://localhost:5174/` — hero, Insert Coin blink, card hover
  2. `http://localhost:5174/play/tictactoe` — mode select, difficulty panel
  3. `http://localhost:5174/play/tictactoe/nickname?mode=local` — P1 → P2 step transition
  4. `http://localhost:5174/play/tictactoe/game?mode=local` — play to win, observe full celebration

---

## Risks and Mitigations

| Risk                                                                                              | Impact | Mitigation                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `AnimatePresence` step slide in NicknameEntry conflicts with `useEffect`-driven `localStep` state | Medium | Key `AnimatePresence` on `localStep`; ensure exit animation completes before state changes content           |
| Cascading win-cell delays via `animation-delay` inline style — React may not re-apply on rematch  | Low    | Reset board clears `winLine` to `null`, removing the pulse entirely; delays only apply when `winLine` is set |
| Two-emitter confetti increases particle count — potential perf hit on low-end mobile              | Low    | Keep total `quantity` the same (55 split to ~28 each); `detectRetina` is already on                          |
| `whileHover` on SVG icon children (`motion.path`) inside `ModeCard` — nested motion contexts      | Low    | Wrap only the icon `<span>` in a `motion.span`; use `whileHover` variants propagated from parent             |

## Open Questions

- None — all design decisions are resolved by the spec above. Implementation can begin.
