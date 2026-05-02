# Gomoku (Five in a Row) — Game Rules Reference

## Overview

Gomoku is a two-player abstract strategy game. Players alternately place stones on a grid; the first player to form an unbroken line of **exactly 5 stones** (standard) or **5 or more** (freestyle) wins.

## Board & Setup

- Standard board: **15×15** grid (tournament standard; 19×19 also common).
- All intersections start empty.
- Stones are placed **on intersections**, not inside squares.
- Rows indexed 0–14 (top to bottom); columns indexed 0–14 (left to right).

## Players & Stones

- Two players: Black and White.
- Black plays first (slight first-move advantage).
- Players take turns; no passing.

## Turn Structure

1. The active player places **one stone** of their color on any **empty intersection**.
2. Stones cannot be moved or removed once placed.
3. The turn passes to the opponent.

## Win Condition (Standard / Freestyle)

| Variant                   | Win Condition                                                                     |
| ------------------------- | --------------------------------------------------------------------------------- |
| **Freestyle**             | First to get **5 or more** consecutive stones in a line.                          |
| **Standard (exact five)** | First to get **exactly 5** consecutive stones. A row of 6 or more does NOT count. |

Winning lines can be in any of the four directions:

| Direction  | Description         |
| ---------- | ------------------- |
| Horizontal | Same row            |
| Vertical   | Same column         |
| Diagonal ↗ | Ascending diagonal  |
| Diagonal ↘ | Descending diagonal |

> **Neon Arena default**: use **Freestyle** rules (5 or more wins) to keep gameplay approachable.

## Draw Condition

- All intersections are filled and no player has won.
- Result: **Draw** (extremely rare on a 15×15 board).

## Special Rules (Advanced — Optional)

### Pro Rule (for Black)

- Black's first stone must be placed on the center intersection (7,7).
- Black's second stone must be placed outside the 5×5 central area.
- White has no placement restrictions.

### Swap Rule

- After Black's first stone is placed, White may choose to swap colors (taking Black's position).
- Reduces first-move advantage.

### Three-and-three Prohibition (Renju / Competitive)

- Black cannot make a move that simultaneously creates two open "threes" (unblocked rows of 3 with open ends on both sides).
- Black cannot make a move that simultaneously creates two "fours" (rows of 4).
- A row of exactly 6 or more for Black is a loss (overline rule).
- These restrictions apply to **Black only**; White has no such restrictions.

> **Neon Arena default**: omit Renju restrictions. Use plain freestyle rules.

## Implementation Notes

- **Win detection after placement**:
  - Only scan lines through the most recently placed stone `(row, col)`.
  - For each of the 4 directions, count consecutive same-color stones in both opposite rays from the placed stone.
  - **Freestyle**: win if total run in any direction ≥ 5.
  - **Standard**: win if total run in any direction == 5 (exclude 6+).
- **Board representation**: 2D array `board[row][col]` with values `null | 'black' | 'white'`.
- **AI considerations**:
  - Threat-space search is effective; pure minimax is too slow on a 15×15 board.
  - Heuristic: score patterns (open-four = critical threat, open-three = strong threat, etc.).
  - Limit candidate moves to a window around existing stones to prune the search space.
  - Pattern weights: five=∞, open-four=10000, blocked-four=1000, open-three=500, blocked-three=100, open-two=50.
