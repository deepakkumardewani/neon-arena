import type { BoardSize } from "@/lib/dotsAndBoxes/types";
import { useDotsSettings } from "@/lib/dotsAndBoxes/state/useDotsSettings";
import { useDotsStore } from "@/lib/dotsAndBoxes/state/useDotsStore";

const SIZE_OPTIONS: { label: string; size: BoardSize }[] = [
  { label: "3×3", size: { rows: 3, cols: 3 } },
  { label: "4×4", size: { rows: 4, cols: 4 } },
  { label: "5×5", size: { rows: 5, cols: 5 } },
];

interface BoardSizePickerProps {
  /** Pass mode to hide in online/friend modes */
  mode: "solo" | "local" | "online" | "friend";
  /** Hidden after first edge claimed */
  hasStarted: boolean;
}

export function BoardSizePicker({ mode, hasStarted }: BoardSizePickerProps) {
  const defaultSize = useDotsSettings((s) => s.defaultSize);
  const updateSetting = useDotsSettings((s) => s.updateSetting);
  const resetGameWithSize = useDotsStore((s) => s.resetGame);

  if (mode === "online" || mode === "friend" || hasStarted) return null;

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl border border-(--na-border) bg-(--na-surface) px-6 py-4"
      style={{ boxShadow: "var(--na-glow-grid)" }}
    >
      <span
        className="text-xs uppercase tracking-widest text-(--na-text-muted)"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        Board Size
      </span>
      <span
        className="max-w-[15rem] text-center text-[0.625rem] leading-snug tracking-wide text-(--na-text-muted)"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        Grid size applies before your first move and is remembered for solo play.
      </span>
      <div className="flex gap-3">
        {SIZE_OPTIONS.map(({ label, size }) => {
          const isSelected = defaultSize.rows === size.rows && defaultSize.cols === size.cols;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                updateSetting("defaultSize", size);
                resetGameWithSize(size);
              }}
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition-all"
              style={{
                fontFamily: "var(--na-font-display)",
                borderColor: isSelected ? "var(--na-cyan)" : "var(--na-border)",
                color: isSelected ? "var(--na-cyan)" : "var(--na-text-muted)",
                background: isSelected
                  ? "color-mix(in srgb, var(--na-cyan) 10%, transparent)"
                  : undefined,
                boxShadow: isSelected
                  ? "0 0 8px color-mix(in srgb, var(--na-cyan) 25%, transparent)"
                  : undefined,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
