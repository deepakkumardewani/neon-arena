import { useEffect, useState } from "react";

const query = "(prefers-reduced-motion: reduce)";

/** True when the user prefers reduced motion (SSR-safe default: false). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = (): void => {
      setReduced(mq.matches);
    };
    update();
    mq.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
    };
  }, []);

  return reduced;
}
