import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";
import Particles from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";

import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ensureParticlesEngine } from "@/lib/particles/ensureEngine";

export type WinOverlayPalette = "cyan" | "rose" | "purple";

export interface WinOverlayProps {
  readonly open: boolean;
  readonly headline: string;
  readonly palette: WinOverlayPalette;
  readonly scoreWins: number;
  readonly scoreLosses: number;
  readonly scoreDraws: number;
  readonly onPlayAgain: () => void;
  readonly onHome: () => void;
  readonly onAutoDismiss: () => void;
}

function paletteToParticleColor(palette: WinOverlayPalette): string {
  if (palette === "rose") return "#ff2d78";
  if (palette === "purple") return "#7b61ff";
  return "#00f5ff";
}

function headlineColor(palette: WinOverlayPalette): string {
  if (palette === "rose") return "var(--na-rose)";
  if (palette === "purple") return "var(--na-purple)";
  return "var(--na-cyan)";
}

function buildParticleOptions(brandHex: string, accentPurpleHex: string): ISourceOptions {
  const trio = [brandHex, "#ffffff", accentPurpleHex];
  return {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    detectRetina: true,
    particles: {
      number: { value: 0 },
      color: { value: brandHex },
      shape: { type: "square" },
      opacity: { value: 1 },
      size: { value: { min: 2, max: 6 } },
      rotate: {
        value: { min: 0, max: 360 },
        direction: "random",
        animation: { enable: true, speed: { min: 10, max: 40 } },
      },
      move: {
        enable: true,
        gravity: { enable: true, acceleration: 12 },
        speed: { min: 8, max: 22 },
        decay: 0.05,
        direction: "none",
        random: true,
        straight: false,
        outModes: { default: "destroy" },
      },
    },
    emitters: [
      {
        autoPlay: true,
        fill: true,
        life: { count: 1, duration: 0.35, wait: false },
        rate: { delay: 0.02, quantity: 28 },
        position: { x: 25, y: 32 },
        startCount: 0,
        particles: {
          color: { value: trio },
          move: {
            speed: { min: 14, max: 28 },
          },
        },
      },
      {
        autoPlay: true,
        fill: true,
        life: { count: 1, duration: 0.35, wait: false },
        rate: { delay: 0.02, quantity: 27 },
        position: { x: 75, y: 32 },
        startCount: 0,
        particles: {
          color: { value: trio },
          move: {
            speed: { min: 14, max: 28 },
          },
        },
      },
    ],
  };
}

export function WinOverlay({
  open,
  headline,
  palette,
  scoreWins,
  scoreLosses,
  scoreDraws,
  onPlayAgain,
  onHome,
  onAutoDismiss,
}: WinOverlayProps) {
  const reducedMotion = useReducedMotion();
  const pid = `na-win-particles-${useId().replace(/:/g, "")}`;
  const [engineReady, setEngineReady] = useState(false);
  const particleColor = paletteToParticleColor(palette);
  const options = useMemo(
    () => buildParticleOptions(particleColor, paletteToParticleColor("purple")),
    [particleColor],
  );
  const showParticles = !reducedMotion;

  useEffect(() => {
    if (!showParticles) {
      setEngineReady(false);
    }
  }, [showParticles]);

  useEffect(() => {
    if (!open || !showParticles) return;
    let cancelled = false;
    void ensureParticlesEngine().then(() => {
      if (!cancelled) setEngineReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, showParticles]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      onAutoDismiss();
    }, 8000);
    return () => {
      window.clearTimeout(id);
    };
  }, [open, onAutoDismiss]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="win-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          initial={{ opacity: reducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: reducedMotion ? 1 : 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
        >
          {showParticles && engineReady ? (
            <div className="pointer-events-none absolute inset-0">
              <Particles id={pid} className="h-full w-full" options={options} />
            </div>
          ) : null}
          <motion.div
            className="relative z-1 flex max-w-md flex-col items-center gap-6 rounded-2xl border border-(--na-border) bg-(--na-surface) px-8 py-10 text-center shadow-(--na-glow-grid)"
            initial={reducedMotion ? { opacity: 1 } : { scale: 0.92, y: 16 }}
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { scale: 0.95, y: 12 }}
            transition={
              reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 28 }
            }
          >
            <h2
              className="text-3xl font-bold tracking-wide sm:text-4xl"
              style={{
                fontFamily: "var(--na-font-display)",
                color: headlineColor(palette),
                textShadow: `0 0 24px ${headlineColor(palette)}`,
              }}
            >
              {headline}
            </h2>
            <p
              className="text-sm text-(--na-text-muted)"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              W: {scoreWins} | L: {scoreLosses} | D: {scoreDraws}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                ringOffset="surface"
                className="px-6"
                style={{ fontFamily: "var(--na-font-display)" }}
                onClick={onPlayAgain}
              >
                Play Again
              </Button>
              <Button
                type="button"
                tone="purple"
                ringOffset="surface"
                className="px-6"
                style={{ fontFamily: "var(--na-font-display)" }}
                onClick={onHome}
              >
                Home
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
