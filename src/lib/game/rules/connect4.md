# Connect 4 — Game Rules Reference

## Board & Setup

- 7 columns × 6 rows grid, oriented vertically.
- All cells start empty.
- Columns are indexed 0–6 (left to right); rows are indexed 0–5 (bottom to top).

## Players & Pieces

- Two players: typically Red and Yellow (in Neon Arena: Player 1 and Player 2).
- Each player has an unlimited supply of discs of their color.
- Player 1 (Red) goes first.

## Turn Structure

1. The active player selects any column that is **not full** (has at least one empty cell).
2. A disc is dropped into that column and falls to the **lowest available row** (gravity simulation).
3. The turn passes to the opponent.

## Win Condition

A player wins immediately when they have **4 or more discs of their color in a consecutive line** in any of the following directions:

| Direction  | Description                                              |
| ---------- | -------------------------------------------------------- |
| Horizontal | 4 in a row across the same row                           |
| Vertical   | 4 in a column stacked on top of each other               |
| Diagonal ↗ | 4 along an ascending diagonal (bottom-left to top-right) |
| Diagonal ↘ | 4 along a descending diagonal (top-left to bottom-right) |

- Check for win **after every disc placement**, not before.
- A win check only needs to examine lines passing through the **most recently placed disc** — no need to scan the entire board.

## Draw Condition

- The board is completely full (all 42 cells occupied) and no player has achieved 4 in a row.
- Result: **Draw**.

## Illegal Moves

- Dropping into a **full column** is not allowed; the player must choose a different column.

## Game Flow

```
Start → Player 1 picks column → disc falls to lowest row →
  Check win → if yes: Player 1 wins, game over
  Check draw → if yes: Draw, game over
  → Player 2 picks column → ... (repeat)
```

## Implementation Notes

- **Column representation**: store each column as an array of cells from bottom (index 0) to top.
- **Drop logic**: find the lowest empty cell index in the chosen column (`nextRow = column.findIndex(cell => cell === null)`).
- **Win detection after placement**:
  - Only check lines through `(col, row)` — the cell just filled.
  - Check all 4 directions; for each direction scan up to 3 cells in each of the two opposite rays and count consecutive same-color discs.
  - Win if any direction yields a run ≥ 4.
- **Full column check**: `column[5] !== null` (top row occupied).
- **Draw check**: all columns are full and no winner.
- **AI considerations**: minimax with alpha-beta pruning; center-column preference heuristic; evaluate threats (3-in-a-row with open end).
