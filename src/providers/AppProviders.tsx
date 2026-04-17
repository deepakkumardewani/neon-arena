import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

import { useRootStore } from "@/hooks/useRootStore";

export function AppProviders({ children }: { readonly children: ReactNode }) {
  const ready = useRootStore((s) => s.ready);

  return <MotionConfig reducedMotion="user">{ready ? children : null}</MotionConfig>;
}
