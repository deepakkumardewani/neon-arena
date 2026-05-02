# Dots & Boxes — Game Rules Reference

## Overview

Dots & Boxes is a two-player pencil-and-paper game. Players take turns drawing edges between adjacent dots; completing the fourth side of a 1×1 box scores a point and grants an extra turn. The player who claims more boxes wins.

## Board & Setup

- An (N+1) × (M+1) grid of dots, producing an N × M grid of potential boxes.
- Standard sizes: 5×5 boxes (6×6 dots), 4×4 boxes (5×5 dots).
- All edges start undrawn.
- No pieces are placed; players simply draw edges.

## Coordinate System

```
(0,0) — (1,0) — (2,0) — ...
  |       |       |
(0,1) — (1,1) — (2,1) — ...
  |       |       |
...
```

- **Horizontal edge**: between dot `(c, r)` and `(c+1, r)` — denoted `H[r][c]`
- **Vertical edge**: between dot `(c, r)` and `(c, r+1)` — denoted `V[r][c]`
- A box at position `(col, row)` is bounded by:
  - Top: `H[row][col]`
  - Bottom: `H[row+1][col]`
  - Left: `V[row][col]`
  - Right: `V[row][col+1]`

## Players

- Two players: Player 1 and Player 2.
- Player 1 moves first.

## Turn Structure

1. The active player **claims one undrawn edge** (horizontal or vertical) anywhere on the board.
2. After drawing the edge, check **every box that shares this edge** (at most 2 boxes):
   - If a box now has all **4 sides drawn**, it is **claimed** by the current player (mark it with their color/initial).
   - The current player **scores 1 point per box claimed**.
3. **Chain turn rule**: If the player completed **at least one box**, they **take another turn immediately**.
4. If no box was completed, the turn passes to the opponent.
5. Repeat until all edges are drawn.

## Scoring

- Each completed box is worth **1 point**.
- The player with the **most boxes at the end** wins.
- Maximum possible score = N × M (total number of boxes).

## Win / Draw Conditions

| Result | Condition                                                                      |
| ------ | ------------------------------------------------------------------------------ |
| Win    | One player claims more than half the total boxes (strictly more than N×M / 2). |
| Draw   | Both players claim exactly N×M / 2 boxes (only possible when N×M is even).     |

## Strategic Concepts

| Concept                   | Description                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Chain**                 | A sequence of boxes each with exactly 3 sides drawn; completing one hands the opponent a forced sequence unless they sacrifice boxes. |
| **Half-open chain**       | A chain with one open end; the opponent can "sacrifice" 2 boxes to avoid handing over the rest.                                       |
| **Double-cross strategy** | Deliberately offer short chains to deny the opponent long chains.                                                                     |
| **Loony move**            | A move that completes 3 sides of a box, handing the opponent a free box. Should be avoided unless forced.                             |

## Implementation Notes

### Edge Storage

```
// For an N×M box grid:
horizontalEdges: boolean[N+1][M]   // H[row][col] — (N+1) rows × M cols
verticalEdges:   boolean[N][M+1]   // V[row][col] — N rows × (M+1) cols
boxOwner:        (1 | 2 | null)[N][M]
```

### Box Completion Check

After drawing edge E, check each adjacent box:

```
function isBoxComplete(row, col):
  return H[row][col] && H[row+1][col] && V[row][col] && V[row][col+1]
```

### Turn Logic

```
function claimEdge(player, edge):
  mark edge as drawn
  boxesClaimed = 0
  for each box adjacent to edge:
    if isBoxComplete(box):
      boxOwner[box] = player
      boxesClaimed++
  if boxesClaimed > 0:
    currentPlayer stays the same   // bonus turn
  else:
    switch to opponent
```

### AI Considerations

- **Easy**: random valid edge selection.
- **Medium**: prefer edges that complete a box; avoid drawing the third side of a box (loony moves) when possible.
- **Hard**: minimax with chain analysis; use double-cross strategy for endgame chain control.
- Game tree is large; alpha-beta pruning and move ordering (complete-box moves first) help significantly.
- For an N×M board the total number of edges = M(N+1) + N(M+1); typical 5×5 game has 60 edges.
