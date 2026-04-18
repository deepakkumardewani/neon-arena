import type { Container, ISourceOptions } from "@tsparticles/engine";
import { useEffect, useId, useMemo, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cssVarRgbForParticles } from "@/lib/particles/cssVarRgbForParticles";
import { ensureParticlesEngine } from "@/lib/particles/ensureEngine";
import { TsparticlesDivHost } from "@/lib/particles/TsparticlesDivHost";

function buildAmbientOptions(purple: string, cyan: string): ISourceOptions {
  return {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    detectRetina: true,
    fpsLimit: 60,
    particles: {
      /* Fixed count: density +0×0 canvas at first layout can yield zero particles */
      number: { value: 72, density: { enable: false } },
      color: { value: [purple, cyan] },
      shape: { type: "circle" },
      opacity: { value: { min: 0.22, max: 0.55 } },
      size: { value: { min: 2.5, max: 6 } },
      move: {
        enable: true,
        speed: { min: 0.25, max: 0.75 },
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "bounce" },
      },
      links: {
        enable: true,
        distance: 150,
        color: purple,
        opacity: 0.1,
        width: 0.75,
      },
    },
    interactivity: {
      events: { onHover: { enable: false }, onClick: { enable: false } },
    },
    pauseOnBlur: false,
    pauseOnOutsideViewport: false,
  };
}

function logParticlesLoaded(container: Container): void {
  if (!import.meta.env.DEV) return;
  const n = container.actualOptions.particles.number.value;
  const { height, width } = container.canvas.size;
  console.warn("[NeonArena] ParticleBackground ready", {
    particles: n,
    canvas: { width, height },
  });
}

export function ParticleBackground() {
  const reduced = useReducedMotion();
  const pid = `na-ambient-${useId().replace(/:/g, "")}`;
  const [engineReady, setEngineReady] = useState(false);
  const [colors, setColors] = useState(() => cssVarRgbForParticles());

  useEffect(() => {
    setColors(cssVarRgbForParticles());
  }, []);

  const options = useMemo(
    () => buildAmbientOptions(colors.purple, colors.cyan),
    [colors.purple, colors.cyan],
  );

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      void ensureParticlesEngine().then(() => {
        if (!cancelled) setEngineReady(true);
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [reduced]);

  if (reduced || !engineReady) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-1 min-h-[100dvh] w-full" aria-hidden>
      <TsparticlesDivHost
        id={pid}
        className="block size-full min-h-[100dvh]"
        options={options}
        onLoaded={logParticlesLoaded}
      />
    </div>
  );
}
