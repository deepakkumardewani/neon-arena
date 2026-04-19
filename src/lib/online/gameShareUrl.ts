/** Build absolute share URL for a friend game on the current origin. */
export function buildGameShareUrl(gameId: string, origin: string): string {
  return `${origin}/game/${gameId}`;
}
