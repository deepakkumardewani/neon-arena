# Chess — Game Rules Reference

## Board & Setup

- 8×8 grid, alternating light and dark squares.
- Each player controls 16 pieces: 1 King, 1 Queen, 2 Rooks, 2 Bishops, 2 Knights, 8 Pawns.
- White occupies rows 1–2; Black occupies rows 7–8.
- Standard starting position (FEN: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`).

## Players & Turn Order

- Two players: White and Black.
- White always moves first.
- Players alternate turns; each turn consists of exactly one move.

## Piece Movement

### King

- Moves exactly 1 square in any direction (horizontal, vertical, diagonal).
- Cannot move into a square that is attacked by any enemy piece.

### Queen

- Moves any number of squares in any direction (horizontal, vertical, diagonal).
- Cannot jump over pieces.

### Rook

- Moves any number of squares horizontally or vertically.
- Cannot jump over pieces.

### Bishop

- Moves any number of squares diagonally.
- Stays on its starting color for the entire game.
- Cannot jump over pieces.

### Knight

- Moves in an "L" shape: 2 squares in one direction + 1 square perpendicular (or vice versa).
- The only piece that can jump over other pieces.

### Pawn

- Moves 1 square forward (toward the opponent's back rank).
- On its very first move, may advance 2 squares forward instead of 1.
- Captures diagonally 1 square forward (cannot capture straight ahead).
- Cannot move backward.

## Special Moves

### Castling

- A one-time move per side involving the King and one Rook.
- **Conditions** (all must be met):
  1. Neither the King nor the chosen Rook has moved previously in the game.
  2. No pieces stand between the King and that Rook.
  3. The King is not currently in check.
  4. The King does not pass through or land on a square attacked by an enemy piece.
- **Execution**: King moves 2 squares toward the Rook; the Rook jumps to the square the King crossed.
- **Kingside castling**: King moves g-file; Rook moves from h-file to f-file.
- **Queenside castling**: King moves c-file; Rook moves from a-file to d-file.

### En Passant

- When a Pawn advances 2 squares from its starting position and lands beside an enemy Pawn, the enemy Pawn may capture it **as if it had only moved 1 square**.
- This capture must be made **immediately** on the very next move; the right expires if not taken.
- The capturing Pawn moves diagonally forward; the captured Pawn is removed from the board.

### Pawn Promotion

- When a Pawn reaches the opponent's back rank (row 8 for White, row 1 for Black) it must be promoted.
- The player chooses to replace it with a Queen, Rook, Bishop, or Knight of the same color.
- Promoting to a Queen is by far the most common choice ("queening").
- Under-promotion to a Knight, Bishop, or Rook is legal and occasionally strategically useful.

## Check, Checkmate & Stalemate

### Check

- The King is in check when it is attacked by at least one enemy piece.
- A player in check **must** resolve the check on their next move.
- Three ways to resolve check:
  1. Move the King to a safe square.
  2. Block the attacking piece (interpose a friendly piece).
  3. Capture the attacking piece.

### Checkmate

- The King is in check and there is no legal move that resolves it.
- The player whose King is checkmated **loses** immediately.

### Stalemate

- The current player is **not** in check but has no legal moves.
- The game ends as a **draw**.

## Draw Conditions

| Condition             | Description                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Stalemate             | No legal moves, not in check.                                                                 |
| Insufficient Material | Neither side has enough pieces to deliver checkmate (e.g., K vs K, K+B vs K, K+N vs K).       |
| Threefold Repetition  | The same board position (including castling rights and en-passant target) occurs three times. |
| Fifty-Move Rule       | 50 consecutive moves by both sides without a pawn advance or capture.                         |
| Mutual Agreement      | Both players agree to a draw.                                                                 |

## Victory Condition

- Deliver **checkmate** to the opponent's King.

## Implementation Notes

- Track castling rights per side (kingside / queenside lost when King or Rook moves).
- Track en-passant target square (set when a Pawn double-pushes; clear after next move).
- Track half-move clock (resets on pawn move or capture) for the fifty-move rule.
- Track full-move number for PGN/FEN output.
- A move generator must filter out any move that leaves the moving player's own King in check.
- Promotion must pause game flow to prompt the player for piece choice.
