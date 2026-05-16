/**
 * Single source of truth for game-over overlay timing across Neon Arena.
 * Chess, Connect4, Tic-Tac-Toe, Dots & Boxes, etc. all mount the same WinOverlay / GameEndOverlay.
 */
export type WinOverlayPalette = "cyan" | "rose" | "purple";

export interface GameEndPresentation {
  readonly open: boolean;
  readonly headline: string;
  readonly palette: WinOverlayPalette;
  readonly celebrate: boolean;
}

/** Shared dimming for board chrome when a game ends (e.g. unclaimed Dots boxes). */
export const GAME_END_BOARD_DIM_MS = 480;

export const WIN_OVERLAY_TIMING = {
  backdropFadeSec: 0.48,
  backdropEase: [0.22, 1, 0.36, 1] as const,
  cardSpring: {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
    mass: 0.9,
  },
  headlineDelaySec: 0.12,
  headlineFadeSec: 0.42,
  /** Confetti burst length — short bursts feel like a flash on wins. */
  confettiBurstSec: 0.58,
  confettiRateDelaySec: 0.008,
} as const;
