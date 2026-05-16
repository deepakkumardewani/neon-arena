import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";
import Particles from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";

import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ensureParticlesEngine } from "@/lib/particles/ensureEngine";

import {
  type GameEndPresentation,
  WIN_OVERLAY_TIMING,
  type WinOverlayPalette,
} from "./presentation";

export type { GameEndPresentation, WinOverlayPalette } from "./presentation";

export type WinOverlayProps = Omit<GameEndPresentation, "celebrate"> & {
  readonly celebrate?: boolean;
  readonly onPlayAgain: () => void;
  readonly onHome: () => void;
};

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
  const perSide = 34;
  const burst = WIN_OVERLAY_TIMING.confettiBurstSec;
  const rateDelay = WIN_OVERLAY_TIMING.confettiRateDelaySec;
  return {
    fullScreen: { enable: false },
    background: { color: { value: "transparent" } },
    detectRetina: true,
    fpsLimit: 120,
    particles: {
      number: { value: 0 },
      color: { value: brandHex },
      shape: { type: ["circle", "square"] },
      opacity: { value: 1 },
      size: { value: { min: 3, max: 9 } },
      rotate: {
        value: { min: 0, max: 360 },
        direction: "random",
        animation: { enable: true, speed: { min: 18, max: 52 } },
      },
      move: {
        enable: true,
        gravity: { enable: true, acceleration: 22 },
        speed: { min: 14, max: 32 },
        decay: 0.025,
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
        life: { count: 1, duration: burst, wait: false },
        rate: { delay: rateDelay, quantity: perSide },
        position: { x: 25, y: 28 },
        startCount: 0,
        particles: {
          color: { value: trio },
          shape: { type: ["circle", "square"] },
          move: {
            speed: { min: 20, max: 42 },
          },
        },
      },
      {
        autoPlay: true,
        fill: true,
        life: { count: 1, duration: burst, wait: false },
        rate: { delay: rateDelay, quantity: perSide },
        position: { x: 75, y: 28 },
        startCount: 0,
        particles: {
          color: { value: trio },
          shape: { type: ["circle", "square"] },
          move: {
            speed: { min: 20, max: 42 },
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
  celebrate,
  onPlayAgain,
  onHome,
}: WinOverlayProps) {
  const reducedMotion = useReducedMotion();
  const pid = `na-win-particles-${useId().replace(/:/g, "")}`;
  const [engineReady, setEngineReady] = useState(false);
  const particleColor = paletteToParticleColor(palette);
  const options = useMemo(
    () => buildParticleOptions(particleColor, paletteToParticleColor("purple")),
    [particleColor],
  );
  const showConfettiBurst = celebrate && !reducedMotion;

  useEffect(() => {
    if (!showConfettiBurst) {
      setEngineReady(false);
    }
  }, [showConfettiBurst]);

  useEffect(() => {
    if (!open || !showConfettiBurst) return;
    let cancelled = false;
    void ensureParticlesEngine().then(() => {
      if (!cancelled) setEngineReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, showConfettiBurst]);

  const backdropEase = WIN_OVERLAY_TIMING.backdropEase;
  const cardSpring = WIN_OVERLAY_TIMING.cardSpring;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="win-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          initial={{ opacity: reducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: reducedMotion ? 1 : 0 }}
          transition={{
            duration: reducedMotion ? 0 : WIN_OVERLAY_TIMING.backdropFadeSec,
            ease: reducedMotion ? "linear" : backdropEase,
          }}
        >
          {showConfettiBurst && engineReady ? (
            <div className="pointer-events-none absolute inset-0">
              <Particles id={pid} className="h-full w-full" options={options} />
            </div>
          ) : null}
          <motion.div
            className="relative z-1 flex max-w-md flex-col items-center gap-6 rounded-2xl border border-(--na-border) bg-(--na-surface) px-8 py-10 text-center shadow-(--na-glow-grid)"
            initial={reducedMotion ? { opacity: 1 } : { scale: 0.94, y: 22 }}
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 1 } : { scale: 0.96, y: 14 }}
            transition={reducedMotion ? { duration: 0 } : cardSpring}
          >
            <motion.h2
              className="text-3xl font-bold tracking-wide sm:text-4xl"
              style={{
                fontFamily: "var(--na-font-display)",
                color: headlineColor(palette),
                textShadow: `0 0 24px ${headlineColor(palette)}`,
              }}
              initial={
                reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      delay: WIN_OVERLAY_TIMING.headlineDelaySec,
                      duration: WIN_OVERLAY_TIMING.headlineFadeSec,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
            >
              {headline}
            </motion.h2>
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      delay: WIN_OVERLAY_TIMING.headlineDelaySec + 0.08,
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
            >
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
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export interface GameEndOverlayProps {
  readonly presentation: GameEndPresentation;
  readonly onPlayAgain: () => void;
  readonly onHome: () => void;
}

/** Canonical wrapper — every game should mount this for win / loss / draw. */
export function GameEndOverlay({ presentation, onPlayAgain, onHome }: GameEndOverlayProps) {
  return (
    <WinOverlay
      open={presentation.open}
      headline={presentation.headline}
      palette={presentation.palette}
      celebrate={presentation.celebrate}
      onPlayAgain={onPlayAgain}
      onHome={onHome}
    />
  );
}
