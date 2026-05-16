import { useNavigate } from "react-router-dom";
import { ErrorBoundary, type FallbackProps } from "./index";
import type { ReactNode } from "react";

function DotsErrorFallback({ error, reset }: FallbackProps) {
  const navigate = useNavigate();

  return (
    <div
      className="flex h-dvh flex-col items-center justify-center gap-6 bg-(--na-bg) px-6 text-center"
      style={{ fontFamily: "var(--na-font-display)" }}
    >
      <p
        className="text-xs tracking-widest text-(--na-rose) uppercase"
        style={{ letterSpacing: "0.25em" }}
      >
        Game Error
      </p>
      <p className="text-3xl font-bold tracking-wide text-(--na-text) uppercase">
        Something went wrong
      </p>
      <p className="max-w-xs text-sm text-(--na-text-muted)">
        {error.message || "An unexpected error occurred during the game."}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => void navigate("/play/dots-and-boxes")}
          className="rounded border border-(--na-border) px-4 py-2 text-sm text-(--na-text-muted) transition-colors hover:border-(--na-cyan) hover:text-(--na-cyan)"
        >
          ← Dots & Boxes
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-(--na-cyan) px-4 py-2 text-sm text-(--na-cyan) transition-colors hover:bg-(--na-cyan)/10"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export function DotsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={(props) => <DotsErrorFallback {...props} />}>{children}</ErrorBoundary>
  );
}
