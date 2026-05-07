import { useChessStore } from "@/lib/chess/state/useChessStore";
import type { PieceColor } from "@/lib/chess/types";

const HINT_TOKENS_PER_GAME = 3;

interface PlayerIndicatorProps {
  color: PieceColor;
  isActive: boolean;
  label: string;
}

function PlayerIndicator({ color, isActive, label }: PlayerIndicatorProps) {
  const accentColor = color === "white" ? "var(--na-cyan)" : "var(--na-rose)";
  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all"
      style={{
        borderColor: isActive ? accentColor : "var(--na-border)",
        background: isActive ? `color-mix(in srgb, ${accentColor} 8%, transparent)` : undefined,
        boxShadow: isActive
          ? `0 0 8px color-mix(in srgb, ${accentColor} 30%, transparent)`
          : undefined,
      }}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: accentColor }}
        aria-hidden="true"
      />
      <span
        className="text-sm font-semibold"
        style={{
          color: isActive ? accentColor : "var(--na-text-muted)",
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

interface Props {
  /** Label for the white player. */
  whiteLabel?: string;
  /** Label for the black player. */
  blackLabel?: string;
  /** Whether hints are enabled. When false, the hint section is hidden. */
  hintsEnabled?: boolean;
  /** Seconds until auto-hint fires; null = timer off. */
  secondsUntilAutoHint?: number | null;
  /** Called when the user clicks the hint button. */
  onRequestHint?: () => void;
  /** Whether the AI is currently thinking (disables hint button). */
  isThinking?: boolean;
}

export function ChessHUD({
  whiteLabel = "White",
  blackLabel = "Black",
  hintsEnabled = true,
  secondsUntilAutoHint = null,
  onRequestHint,
  isThinking = false,
}: Props) {
  const activeColor = useChessStore((s) => s.state.activeColor);
  const hintTokens = useChessStore((s) => s.state.hintTokens);

  const canHint = hintTokens > 0 && hintsEnabled && !isThinking;

  const handleHint = () => {
    if (!canHint || !onRequestHint) return;
    onRequestHint();
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-(--na-border) bg-(--na-surface) px-4 py-3"
      style={{ boxShadow: "var(--na-glow-grid)" }}
    >
      {/* Player indicators */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PlayerIndicator color="white" isActive={activeColor === "white"} label={whiteLabel} />
        <span className="hidden text-xs text-(--na-text-muted) sm:block">vs</span>
        <PlayerIndicator color="black" isActive={activeColor === "black"} label={blackLabel} />
      </div>

      {/* Hint section */}
      {hintsEnabled && (
        <div className="flex items-center justify-between gap-3 border-t border-(--na-border) pt-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs text-(--na-text-muted)"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              Hints
            </span>
            {/* Token badges */}
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
                    color: i < hintTokens ? "var(--na-cyan)" : "var(--na-text-muted)",
                    border: `1px solid ${i < hintTokens ? "var(--na-cyan)" : "var(--na-border)"}`,
                  }}
                  aria-hidden="true"
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
          </div>

          <button
            type="button"
            disabled={!canHint}
            onClick={handleHint}
            className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontFamily: "var(--na-font-display)",
              borderColor: canHint ? "var(--na-cyan)" : "var(--na-border)",
              color: canHint ? "var(--na-cyan)" : "var(--na-text-muted)",
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
    </div>
  );
}
