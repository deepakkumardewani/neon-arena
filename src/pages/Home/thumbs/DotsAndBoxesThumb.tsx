const ROWS = 3;
const COLS = 3;
const CELL = 20;

const LINES = [
  { x1: 0, y1: 0, x2: 1, y2: 0, color: "var(--na-cyan)", cls: "na-dab-thumb-line-cyan" },
  { x1: 1, y1: 0, x2: 2, y2: 0, color: "var(--na-rose)", cls: "na-dab-thumb-line-rose" },
  { x1: 0, y1: 0, x2: 0, y2: 1, color: "var(--na-cyan)", cls: "na-dab-thumb-line-cyan" },
  { x1: 1, y1: 0, x2: 1, y2: 1, color: "var(--na-rose)", cls: "na-dab-thumb-line-rose" },
  { x1: 2, y1: 0, x2: 2, y2: 1, color: "var(--na-cyan)", cls: "na-dab-thumb-line-cyan" },
  { x1: 0, y1: 1, x2: 1, y2: 1, color: "var(--na-rose)", cls: "na-dab-thumb-line-rose" },
  { x1: 1, y1: 1, x2: 1, y2: 2, color: "var(--na-cyan)", cls: "na-dab-thumb-line-cyan" },
  { x1: 0, y1: 2, x2: 1, y2: 2, color: "var(--na-cyan)", cls: "na-dab-thumb-line-cyan" },
  { x1: 0, y1: 1, x2: 0, y2: 2, color: "var(--na-rose)", cls: "na-dab-thumb-line-rose" },
] as const;

export function DotsAndBoxesThumb() {
  const offsetX = (100 - (COLS - 1) * CELL) / 2;
  const offsetY = (100 - (ROWS - 1) * CELL) / 2;

  return (
    <div className="flex h-full items-center justify-center p-6">
      <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full max-w-28" aria-hidden>
        <defs>
          <filter id="home-dab-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="var(--na-purple)"
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        <g filter="url(#home-dab-glow)" opacity="0.85">
          {LINES.map((l, i) => (
            <line
              key={i}
              className={l.cls}
              x1={offsetX + l.x1 * CELL}
              y1={offsetY + l.y1 * CELL}
              x2={offsetX + l.x2 * CELL}
              y2={offsetY + l.y2 * CELL}
              stroke={l.color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
          {Array.from({ length: ROWS * COLS }).map((_, i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            return (
              <circle
                key={i}
                className="na-dab-thumb-dot"
                cx={offsetX + c * CELL}
                cy={offsetY + r * CELL}
                r="2.5"
                fill="var(--na-purple)"
              />
            );
          })}
          <rect
            x={offsetX + 1.5}
            y={offsetY + 1.5}
            width={CELL - 1}
            height={CELL - 1}
            fill="var(--na-cyan)"
            opacity="0.18"
            rx="1"
          />
        </g>
      </svg>
    </div>
  );
}
