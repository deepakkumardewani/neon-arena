export function TicTacToeThumb() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full max-w-28" aria-hidden>
        <defs>
          <filter id="home-ttt-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="var(--na-purple)"
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        <g
          stroke="var(--na-purple)"
          strokeWidth="2"
          filter="url(#home-ttt-glow)"
          opacity="0.85"
          className="na-ttt-thumb-grid"
        >
          <line x1="35" y1="10" x2="35" y2="90" />
          <line x1="65" y1="10" x2="65" y2="90" />
          <line x1="10" y1="35" x2="90" y2="35" />
          <line x1="10" y1="65" x2="90" y2="65" />
        </g>
        <line
          className="na-ttt-thumb-x-arm"
          x1="18"
          y1="18"
          x2="30"
          y2="30"
          stroke="var(--na-cyan)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          className="na-ttt-thumb-x-arm"
          x1="30"
          y1="18"
          x2="18"
          y2="30"
          stroke="var(--na-cyan)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          className="na-ttt-thumb-o-ring"
          cx="78"
          cy="24"
          r="9"
          fill="none"
          stroke="var(--na-rose)"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}
