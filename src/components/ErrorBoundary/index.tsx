import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (props: FallbackProps) => ReactNode;
}

export interface FallbackProps {
  error: Error;
  reset: () => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.fallback ? (
        this.props.fallback({ error, reset: this.reset })
      ) : (
        <DefaultFallback error={error} reset={this.reset} />
      );
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, reset }: FallbackProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-(--na-bg) px-6 text-center"
      style={{ fontFamily: "var(--na-font-display)" }}
    >
      <p className="text-4xl font-bold tracking-widest text-(--na-rose) uppercase">Error</p>
      <p className="max-w-sm text-sm text-(--na-text-muted)">
        {error.message || "Something went wrong."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded border border-(--na-cyan) px-4 py-2 text-sm text-(--na-cyan) transition-colors hover:bg-(--na-cyan)/10"
      >
        Try Again
      </button>
    </div>
  );
}
