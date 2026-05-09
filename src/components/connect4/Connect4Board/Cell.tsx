import type { CellValue } from "@/lib/connect4/types";

interface CellProps {
  value: CellValue;
  isWinning?: boolean;
  isDesaturated?: boolean;
  isLastPlaced?: boolean;
  /** True while the falling-disc animation is in flight for this cell — hides the disc so the overlay is visible instead */
  isAnimating?: boolean;
}

export function Cell({
  value,
  isWinning = false,
  isDesaturated = false,
  isLastPlaced = false,
  isAnimating = false,
}: CellProps) {
  const playerColor =
    value === 1 ? "var(--na-cyan)" : value === 2 ? "var(--na-rose)" : null;

  const hasDisc = playerColor !== null && !isAnimating;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: "min(11vw, 72px)", height: "min(11vw, 72px)" }}
    >
      {/* Cell hole */}
      <div
        className="absolute inset-[8%] rounded-full"
        style={{ background: "rgba(0,0,0,0.55)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6)" }}
      />

      {/* Disc */}
      {hasDisc && (
        <div
          className={[
            "absolute inset-[8%] rounded-full transition-opacity duration-200",
            isWinning ? "na-c4-win-pulse" : "",
            isLastPlaced && !isWinning ? "na-c4-last-placed" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            {
              background: playerColor,
              opacity: isDesaturated ? 0.4 : 1,
              filter: !isWinning
                ? `drop-shadow(0 0 4px ${playerColor})`
                : undefined,
              "--na-c4-player-color": playerColor,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}
