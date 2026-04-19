import type { ReactElement } from "react";

export function ConnectionLostBanner(): ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 rounded-tl-lg rounded-br-lg border-2 border-(--na-rose) bg-(--na-surface) px-4 py-3 text-sm text-(--na-text)"
      style={{ fontFamily: "var(--na-font-display)" }}
    >
      <p className="font-semibold text-(--na-rose)">Connection lost</p>
      <p className="mt-1 text-(--na-text-muted)">
        Firebase is offline. Moves stay paused until the link returns.
      </p>
    </div>
  );
}
