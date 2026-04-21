import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { ConfirmDialog } from "@/components/ui/confirm/ConfirmDialog";
import { audioManager } from "@/lib/audio/audioManager";
import { hapticManager } from "@/lib/haptics/hapticManager";

export interface ConfirmOptions {
  readonly title?: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

export interface AlertOptions {
  readonly title?: string;
  readonly message: string;
  readonly okLabel?: string;
}

export interface AppDialogApi {
  readonly confirm: (options: ConfirmOptions) => Promise<boolean>;
  readonly alert: (options: AlertOptions | string) => Promise<void>;
}

const ConfirmContext = createContext<AppDialogApi | null>(null);

type DialogState =
  | { readonly kind: "closed" }
  | {
      readonly kind: "confirm";
      readonly title?: string;
      readonly message: string;
      readonly confirmLabel: string;
      readonly cancelLabel: string;
      readonly resolve: (value: boolean) => void;
    }
  | {
      readonly kind: "alert";
      readonly title?: string;
      readonly message: string;
      readonly okLabel: string;
      readonly resolve: () => void;
    };

export function ConfirmProvider({ children }: { readonly children: ReactNode }): ReactElement {
  const [state, setState] = useState<DialogState>({ kind: "closed" });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({
        kind: "confirm",
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? "OK",
        cancelLabel: options.cancelLabel ?? "Cancel",
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    const message = typeof options === "string" ? options : options.message;
    const title = typeof options === "string" ? undefined : options.title;
    const okLabel = typeof options === "string" ? "OK" : (options.okLabel ?? "OK");
    return new Promise<void>((resolve) => {
      setState({
        kind: "alert",
        title,
        message,
        okLabel,
        resolve,
      });
    });
  }, []);

  const api = useMemo<AppDialogApi>(
    () => ({
      confirm,
      alert,
    }),
    [alert, confirm],
  );

  const handleConfirm = useCallback((): void => {
    audioManager.play("click");
    hapticManager.tap();
    if (state.kind === "confirm") {
      const r = state.resolve;
      setState({ kind: "closed" });
      r(true);
      return;
    }
    if (state.kind === "alert") {
      const r = state.resolve;
      setState({ kind: "closed" });
      r();
    }
  }, [state]);

  const handleCancel = useCallback((): void => {
    if (state.kind !== "confirm") return;
    audioManager.play("click");
    hapticManager.tap();
    const r = state.resolve;
    setState({ kind: "closed" });
    r(false);
  }, [state]);

  const open = state.kind !== "closed";
  const dialogProps =
    state.kind === "confirm"
      ? {
          open,
          variant: "confirm" as const,
          title: state.title,
          message: state.message,
          confirmLabel: state.confirmLabel,
          cancelLabel: state.cancelLabel,
          onCancel: handleCancel,
        }
      : state.kind === "alert"
        ? {
            open,
            variant: "alert" as const,
            title: state.title,
            message: state.message,
            confirmLabel: state.okLabel,
            cancelLabel: "",
            onCancel: undefined,
          }
        : null;

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      {dialogProps !== null ? (
        <ConfirmDialog
          open={dialogProps.open}
          variant={dialogProps.variant}
          title={dialogProps.title}
          message={dialogProps.message}
          confirmLabel={dialogProps.confirmLabel}
          cancelLabel={dialogProps.cancelLabel}
          onConfirm={handleConfirm}
          onCancel={dialogProps.onCancel}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): AppDialogApi {
  const ctx = useContext(ConfirmContext);
  if (ctx === null) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
