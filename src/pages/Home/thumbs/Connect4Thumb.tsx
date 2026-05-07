const DISCS = [
  { col: 0, row: 0, color: "var(--na-cyan)", cls: "na-c4-thumb-disc-cyan" },
  { col: 1, row: 0, color: "var(--na-rose)", cls: "na-c4-thumb-disc-rose" },
  { col: 0, row: 1, color: "var(--na-rose)", cls: "na-c4-thumb-disc-rose" },
  { col: 2, row: 0, color: "var(--na-cyan)", cls: "na-c4-thumb-disc-cyan" },
  { col: 1, row: 1, color: "var(--na-cyan)", cls: "na-c4-thumb-disc-cyan" },
  { col: 0, row: 2, color: "var(--na-cyan)", cls: "na-c4-thumb-disc-cyan" },
  { col: 2, row: 1, color: "var(--na-rose)", cls: "na-c4-thumb-disc-rose" },
] as const;

const COLS = 5;
const ROWS = 4;
const CELL = 16;

export function Connect4Thumb() {
  const offsetX = (100 - COLS * CELL) / 2;
  const offsetY = (100 - ROWS * CELL) / 2;

  return (
    <div className="flex h-full items-center justify-center p-6">
      <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full max-w-28" aria-hidden>
        <defs>
          <filter id="home-c4-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="var(--na-purple)"
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        <g filter="url(#home-c4-glow)" opacity="0.85">
          <rect
            className="na-c4-thumb-board"
            x={offsetX - 4}
            y={offsetY - 8}
            width={COLS * CELL + 8}
            height={ROWS * CELL + 8 + 4}
            fill="none"
            stroke="var(--na-purple)"
            strokeWidth="1.5"
            rx="3"
          />
          {Array.from({ length: COLS * ROWS }).map((_, i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            return (
              <circle
                key={i}
                cx={offsetX + CELL / 2 + c * CELL}
                cy={offsetY + CELL / 2 + r * CELL}
                r="5.5"
                fill="var(--na-bg)"
                stroke="var(--na-purple)"
                strokeWidth="1"
              />
            );
          })}
          {DISCS.map((d, i) => (
            <circle
              key={`disc-${i}`}
              className={d.cls}
              cx={offsetX + CELL / 2 + d.col * CELL}
              cy={offsetY - 8 + CELL / 2 + (ROWS - 1 - d.row) * CELL}
              r="5.5"
              fill={d.color}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
