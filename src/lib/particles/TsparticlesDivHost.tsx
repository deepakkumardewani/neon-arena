import { tsParticles } from "@tsparticles/engine";
import type { Container, ISourceOptions } from "@tsparticles/engine";
import { useLayoutEffect, useRef } from "react";

export interface TsparticlesDivHostProps {
  readonly id: string;
  readonly className: string;
  readonly options: ISourceOptions;
  readonly onLoaded?: (container: Container) => void;
}

/**
 * Drop-in replacement for `@tsparticles/react` `Particles` that only re-runs `load` when
 * `id` or `options` change. The published wrapper lists the entire `props` object in its
 * effect deps, so any parent re-render destroys and reloads the canvas (often invisible).
 */
export function TsparticlesDivHost({ id, className, options, onLoaded }: TsparticlesDivHostProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (el === null) return;

    let instance: Container | undefined;
    let cancelled = false;

    void tsParticles
      .load({ id, element: el, options })
      .then((c) => {
        if (c === undefined) return;
        if (cancelled) {
          c.destroy();
          return;
        }
        instance = c;
        onLoadedRef.current?.(c);
      })
      .catch((err: unknown) => {
        console.warn("[NeonArena] tsparticles load failed:", err);
      });

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [id, options]);

  return <div ref={hostRef} id={id} className={className} />;
}
