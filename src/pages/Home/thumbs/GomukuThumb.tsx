const STONES = [
  { x: 2, y: 3, color: "var(--na-cyan)", cls: "na-gmk-thumb-stone-cyan" },
  { x: 3, y: 3, color: "var(--na-rose)", cls: "na-gmk-thumb-stone-rose" },
  { x: 2, y: 4, color: "var(--na-cyan)", cls: "na-gmk-thumb-stone-cyan" },
  { x: 3, y: 2, color: "var(--na-rose)", cls: "na-gmk-thumb-stone-rose" },
  { x: 4, y: 3, color: "var(--na-cyan)", cls: "na-gmk-thumb-stone-cyan" },
  { x: 3, y: 4, color: "var(--na-rose)", cls: "na-gmk-thumb-stone-rose" },
] as const;

const GRID_SIZE = 9;
const CELL = 9;

export function GomukuThumb() {
  const offsetX = (100 - (GRID_SIZE - 1) * CELL) / 2;
  const offsetY = (100 - (GRID_SIZE - 1) * CELL) / 2;

  return (
    <div className="flex h-full items-center justify-center p-6">
      <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full max-w-28" aria-hidden>
        <defs>
          <filter id="home-gmk-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="var(--na-purple)"
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        <g filter="url(#home-gmk-glow)" opacity="0.85" className="na-gmk-thumb-grid">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={offsetX}
              y1={offsetY + i * CELL}
              x2={offsetX + (GRID_SIZE - 1) * CELL}
              y2={offsetY + i * CELL}
              stroke="var(--na-purple)"
              strokeWidth="0.75"
            />
          ))}
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={offsetX + i * CELL}
              y1={offsetY}
              x2={offsetX + i * CELL}
              y2={offsetY + (GRID_SIZE - 1) * CELL}
              stroke="var(--na-purple)"
              strokeWidth="0.75"
            />
          ))}
        </g>
        {STONES.map((s, i) => (
          <circle
            key={i}
            className={s.cls}
            cx={offsetX + s.x * CELL}
            cy={offsetY + s.y * CELL}
            r="3.5"
            fill={s.color}
          />
        ))}
      </svg>
    </div>
  );
}
