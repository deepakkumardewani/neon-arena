import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

import { ConfirmProvider } from "@/components/ui/confirm";
import { ToastProvider } from "@/components/ui/toast";
import { useRootStore } from "@/hooks/useRootStore";

export function AppProviders({ children }: { readonly children: ReactNode }) {
  const ready = useRootStore((s) => s.ready);

  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <ConfirmProvider>{ready ? children : null}</ConfirmProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
