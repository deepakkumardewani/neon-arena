import { useConnect4Store } from "@/lib/connect4/state/useConnect4Store";
import type { PlayerId } from "@/lib/connect4/types";

const HINT_TOKENS_PER_GAME = 3;

const PLAYER_COLORS: Record<PlayerId, string> = {
  1: "var(--na-cyan)",
  2: "var(--na-rose)",
};

interface PlayerChipProps {
  playerId: PlayerId;
  label: string;
  isActive: boolean;
}

function PlayerChip({ playerId, label, isActive }: PlayerChipProps) {
  const color = PLAYER_COLORS[playerId];
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all"
      style={{
        borderColor: isActive ? color : "var(--na-border)",
        background: isActive ? `color-mix(in srgb, ${color} 8%, transparent)` : undefined,
        boxShadow: isActive ? `0 0 8px color-mix(in srgb, ${color} 30%, transparent)` : undefined,
      }}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
      <span
        className="text-sm font-semibold"
        style={{
          color: isActive ? color : "var(--na-text-muted, #888)",
          fontFamily: "var(--na-font-display)",
        }}
      >
        {label}
      </span>
      {isActive && (
        <span className="text-[10px] font-semibold tracking-widest text-(--na-text-muted) uppercase">
          (turn)
        </span>
      )}
    </div>
  );
}

interface Connect4HUDProps {
  p1Label?: string;
  p2Label?: string;
  hintsEnabled?: boolean;
  secondsUntilAutoHint?: number | null;
  onRequestHint?: () => void;
  onUndo?: () => void;
  isThinking?: boolean;
  showUndo?: boolean;
  /** Online: swap so local user appears on left */
  localPlayer?: PlayerId;
}

export function Connect4HUD({
  p1Label = "Player 1",
  p2Label = "Player 2",
  hintsEnabled = true,
  secondsUntilAutoHint = null,
  onRequestHint,
  onUndo,
  isThinking = false,
  showUndo = false,
  localPlayer,
}: Connect4HUDProps) {
  const { state, undoMove } = useConnect4Store();
  const { currentPlayer, hintTokens, history, status } = state;

  const canHint = hintTokens > 0 && hintsEnabled && !isThinking && status === "playing";
  const canUndo = history.length > 0 && status !== "finished";

  const handleHint = () => {
    if (!canHint) return;
    onRequestHint?.();
  };

  const handleUndo = () => {
    if (!canUndo) return;
    onUndo?.();
    undoMove("solo");
  };

  // Determine display order: if localPlayer set, show them on left
  const leftPlayer: PlayerId = localPlayer ?? 1;
  const rightPlayer: PlayerId = leftPlayer === 1 ? 2 : 1;
  const leftLabel = leftPlayer === 1 ? p1Label : p2Label;
  const rightLabel = rightPlayer === 1 ? p1Label : p2Label;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-(--na-border) bg-(--na-surface) px-4 py-3"
      style={{ boxShadow: "var(--na-glow-grid)" }}
    >
      {/* Player indicators */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PlayerChip
          playerId={leftPlayer}
          label={leftLabel}
          isActive={currentPlayer === leftPlayer}
        />
        <span className="hidden text-xs text-(--na-text-muted) sm:block">vs</span>
        <PlayerChip
          playerId={rightPlayer}
          label={rightLabel}
          isActive={currentPlayer === rightPlayer}
        />
      </div>

      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex items-center gap-2 text-xs text-(--na-text-muted)">
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 border-transparent"
            style={{ borderTopColor: "var(--na-cyan)" }}
            aria-hidden
          />
          <span style={{ fontFamily: "var(--na-font-display)" }}>Thinking…</span>
        </div>
      )}

      {/* Bottom row: hints + undo */}
      {(hintsEnabled || showUndo) && (
        <div className="flex items-center justify-between gap-3 border-t border-(--na-border) pt-3">
          {hintsEnabled && (
            <div className="flex items-center gap-2">
              <span
                className="text-xs text-(--na-text-muted)"
                style={{ fontFamily: "var(--na-font-display)" }}
              >
                Hints
              </span>
              <div className="flex gap-1">
                {Array.from({ length: HINT_TOKENS_PER_GAME }, (_, i) => (
                  <span
                    key={i}
                    className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                    style={{
                      background:
                        i < hintTokens
                          ? "color-mix(in srgb, var(--na-cyan) 20%, transparent)"
                          : "var(--na-surface-2, var(--na-border))",
                      color: i < hintTokens ? "var(--na-cyan)" : "var(--na-text-muted, #888)",
                      border: `1px solid ${i < hintTokens ? "var(--na-cyan)" : "var(--na-border)"}`,
                    }}
                    aria-hidden
                  >
                    ◆
                  </span>
                ))}
              </div>
              {secondsUntilAutoHint !== null && (
                <span className="text-[10px] text-(--na-text-muted) tabular-nums">
                  auto in {secondsUntilAutoHint}s
                </span>
              )}
              <button
                type="button"
                disabled={!canHint}
                onClick={handleHint}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  fontFamily: "var(--na-font-display)",
                  borderColor: canHint ? "var(--na-cyan)" : "var(--na-border)",
                  color: canHint ? "var(--na-cyan)" : "var(--na-text-muted, #888)",
                  background: canHint
                    ? "color-mix(in srgb, var(--na-cyan) 8%, transparent)"
                    : undefined,
                }}
                aria-label={`Request hint (${hintTokens} remaining)`}
              >
                Hint
              </button>
            </div>
          )}

          {showUndo && (
            <button
              type="button"
              disabled={!canUndo}
              onClick={handleUndo}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                fontFamily: "var(--na-font-display)",
                borderColor: canUndo ? "var(--na-border)" : "var(--na-border)",
                color: canUndo ? "var(--na-text-muted, #888)" : "var(--na-text-muted, #888)",
              }}
              aria-label="Undo last move"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
