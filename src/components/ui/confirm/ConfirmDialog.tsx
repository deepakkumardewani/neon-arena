import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId } from "react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/Button";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly variant: "confirm" | "alert";
  readonly title?: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  /** Required when `variant` is `"confirm"` (Escape and backdrop). */
  readonly onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  variant,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      if (variant === "confirm" && onCancel !== undefined) onCancel();
      else onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, variant, onCancel, onConfirm]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 z-[200] cursor-default bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (variant === "confirm" && onCancel !== undefined) onCancel();
              else onConfirm();
            }}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={title !== undefined && title !== "" ? titleId : undefined}
            aria-describedby={descId}
            className="fixed top-1/2 left-1/2 z-[201] w-[min(90vw,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-tl-xl rounded-br-xl border border-(--na-cyan) bg-(--na-surface) p-6 shadow-(--na-glow-grid)"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            {title !== undefined && title !== "" ? (
              <h2
                id={titleId}
                className="mb-3 text-base font-semibold text-(--na-text)"
                style={{ fontFamily: "var(--na-font-display)" }}
              >
                {title}
              </h2>
            ) : null}
            <p
              id={descId}
              className="text-sm leading-relaxed text-(--na-text-muted)"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              {message}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {variant === "confirm" ? (
                <Button type="button" tone="surface" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              ) : null}
              <Button
                type="button"
                tone="cyan"
                onClick={onConfirm}
                className={variant === "alert" ? "min-w-[5.5rem]" : ""}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
