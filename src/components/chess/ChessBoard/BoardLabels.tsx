interface Props {
  flipped: boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export function BoardLabels({ flipped }: Props) {
  const files = flipped ? [...FILES].reverse() : [...FILES];
  const ranks = flipped ? [...RANKS] : [...RANKS].reverse();

  return (
    <>
      {/* Rank labels (left side, top to bottom) */}
      <div
        className="pointer-events-none absolute left-0 top-0 flex h-full flex-col"
        style={{ width: "1.25rem" }}
        aria-hidden
      >
        {ranks.map((rank) => (
          <div
            key={rank}
            className="flex flex-1 items-start justify-center pt-0.5 text-[0.6rem] font-medium leading-none"
            style={{
              fontFamily: "var(--na-font-body)",
              color: "var(--na-text-muted)",
            }}
          >
            {rank}
          </div>
        ))}
      </div>

      {/* File labels (bottom, left to right) */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 flex w-full flex-row"
        style={{ height: "1.25rem" }}
        aria-hidden
      >
        {files.map((file) => (
          <div
            key={file}
            className="flex flex-1 items-end justify-end pr-0.5 pb-0.5 text-[0.6rem] font-medium leading-none"
            style={{
              fontFamily: "var(--na-font-body)",
              color: "var(--na-text-muted)",
            }}
          >
            {file}
          </div>
        ))}
      </div>
    </>
  );
}
