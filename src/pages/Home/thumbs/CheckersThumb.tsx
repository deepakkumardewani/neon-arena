export function CheckersThumb() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full max-w-28" aria-hidden>
        <defs>
          <filter id="home-chk-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="var(--na-purple)"
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        <g filter="url(#home-chk-glow)" opacity="0.85" className="na-chk-thumb-board">
          {[0, 1, 2, 3].flatMap((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={20 + col * 15}
                y={20 + row * 15}
                width="15"
                height="15"
                fill={(row + col) % 2 === 0 ? "var(--na-purple)" : "transparent"}
                opacity={(row + col) % 2 === 0 ? 0.35 : 0}
                rx="1"
              />
            )),
          )}
        </g>
        <circle
          className="na-chk-thumb-piece-cyan"
          cx="27.5"
          cy="72.5"
          r="5.5"
          fill="var(--na-cyan)"
        />
        <circle
          className="na-chk-thumb-piece-cyan"
          cx="57.5"
          cy="72.5"
          r="5.5"
          fill="var(--na-cyan)"
        />
        <circle
          className="na-chk-thumb-piece-cyan"
          cx="42.5"
          cy="57.5"
          r="5.5"
          fill="var(--na-cyan)"
        />
        <circle
          className="na-chk-thumb-piece-rose"
          cx="42.5"
          cy="27.5"
          r="5.5"
          fill="var(--na-rose)"
        />
        <circle
          className="na-chk-thumb-piece-rose"
          cx="72.5"
          cy="27.5"
          r="5.5"
          fill="var(--na-rose)"
        />
        <circle cx="27.5" cy="42.5" r="5" fill="none" stroke="var(--na-rose)" strokeWidth="1.2" />
        <circle cx="57.5" cy="42.5" r="5" fill="none" stroke="var(--na-cyan)" strokeWidth="1.2" />
      </svg>
    </div>
  );
}
