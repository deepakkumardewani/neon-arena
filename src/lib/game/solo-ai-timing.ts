/** Solo AI waits at least this long before moving so the swap doesn’t feel instant. */
export const SOLO_AI_MOVE_DELAY_MS_MIN = 600;
/** Random extra ms on top of the minimum — humanizes pacing without tying to difficulty. */
export const SOLO_AI_MOVE_DELAY_MS_JITTER = 900;

export function soloAiMoveDelayMs(): number {
  return SOLO_AI_MOVE_DELAY_MS_MIN + Math.random() * SOLO_AI_MOVE_DELAY_MS_JITTER;
}
