export function ChessThumb() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full max-w-28" aria-hidden>
        <defs>
          <filter id="home-chess-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="var(--na-purple)"
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        <g filter="url(#home-chess-glow)" opacity="0.85" className="na-chess-thumb-grid">
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
        <path
          className="na-chess-thumb-white"
          d="M27 80 L27 68 C27 60 35 58 35 50 L35 38 L30 32 L32 18 L38 24 L42 18 L42 32 L40 38 L40 50 C40 58 48 60 48 68 L48 80 Z"
          fill="var(--na-cyan)"
          opacity="0.9"
        />
        <path
          className="na-chess-thumb-black"
          d="M60 80 L60 70 C60 64 66 62 66 56 L66 48 L63 44 L64 34 L68 38 L72 34 L72 44 L69 48 L69 56 C69 62 75 64 75 70 L75 80 Z"
          fill="var(--na-rose)"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
