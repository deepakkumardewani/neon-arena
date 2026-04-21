import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  /** Time on screen in ms. Default 2600. */
  readonly durationMs?: number;
}

interface ToastItem {
  readonly id: string;
  readonly message: string;
  readonly variant: ToastVariant;
}

export interface ToastApi {
  readonly success: (message: string, options?: ToastOptions) => void;
  readonly error: (message: string, options?: ToastOptions) => void;
  readonly info: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION_MS = 2600;

function variantSurfaceClasses(variant: ToastVariant): string {
  if (variant === "success") return "border-(--na-cyan) text-(--na-cyan) shadow-(--na-glow-grid)";
  if (variant === "error") return "border-(--na-rose) text-(--na-rose) shadow-(--na-glow-o)";
  return "border-(--na-purple) text-(--na-purple) shadow-(--na-glow-grid)";
}

function ToastViewport({ items }: { readonly items: readonly ToastItem[] }): ReactElement | null {
  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex max-w-[min(90vw,24rem)] -translate-x-1/2 flex-col items-center gap-2"
      aria-label="Notifications"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`rounded-full border bg-(--na-surface) px-5 py-2.5 text-sm ${variantSurfaceClasses(t.variant)}`}
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }: { readonly children: ReactNode }): ReactElement {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismissAfter = useCallback((id: string, durationMs: number): void => {
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, durationMs);
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions): void => {
      const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
      idRef.current += 1;
      const id = `toast-${idRef.current}`;
      setItems((prev) => [...prev, { id, message, variant }]);
      dismissAfter(id, durationMs);
    },
    [dismissAfter],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => {
        push("success", message, options);
      },
      error: (message, options) => {
        push("error", message, options);
      },
      info: (message, options) => {
        push("info", message, options);
      },
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
