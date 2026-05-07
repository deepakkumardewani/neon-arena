import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { GameCard } from "@/components/GameCard";
import { OnlineCounter } from "@/components/OnlineCounter";
import { Button } from "@/components/ui/Button";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SettingsPanel } from "@/components/SettingsPanel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { audioManager } from "@/lib/audio/audioManager";
import { hapticManager } from "@/lib/haptics/hapticManager";
import {
  TicTacToeThumb,
  ChessThumb,
  Connect4Thumb,
  GomukuThumb,
  CheckersThumb,
  DotsAndBoxesThumb,
} from "./thumbs";

const HERO_EASE = [0.22, 1, 0.36, 1] as const;

function cardVariants(reducedMotion: boolean) {
  return {
    variants: {
      hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
      show: { opacity: 1, y: 0 },
    },
    transition: { duration: reducedMotion ? 0 : 0.45, ease: HERO_EASE },
  };
}

export function HomePage() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  const heroChild = (delaySec: number) =>
    reducedMotion
      ? { duration: 0, delay: 0 }
      : { duration: 0.45, delay: delaySec, ease: HERO_EASE };

  const cv = cardVariants(reducedMotion);

  function openSettings() {
    audioManager.play("click");
    hapticManager.tap();
    setSettingsOpen(true);
  }

  function selectTicTacToe() {
    audioManager.play("click");
    hapticManager.tap();
    void navigate("/play/tictactoe");
  }

  return (
    <div className="na-pregame-scene relative min-h-screen">
      <ParticleBackground densityBoost />
      <div className="relative z-10 overflow-x-hidden">
        <header
          className="relative border-b border-(--na-border) bg-(--na-bg) px-5 py-7 md:px-8 md:py-9 lg:pl-14 lg:pr-10"
          style={{ paddingLeft: "var(--na-space-page-x)", paddingRight: "var(--na-space-page-x)" }}
        >
          <div
            className="na-hero-scanline-overlay pointer-events-none absolute inset-0 overflow-hidden opacity-[0.085]"
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl lg:max-w-[28rem] lg:flex-[1.15] lg:min-w-0">
              <div className="border-l-2 border-(--na-cyan) pl-5 md:pl-6">
                <motion.p
                  className="text-[10px] font-medium tracking-[0.42em] text-(--na-purple) uppercase"
                  style={{ fontFamily: "var(--na-font-display)", marginBottom: 0 }}
                  initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={heroChild(0)}
                >
                  <span className="na-insert-coin-blink inline-flex items-center">
                    <span>Insert coin</span>
                    <span className="na-insert-coin-cursor font-mono leading-none">▍</span>
                  </span>
                </motion.p>
                <motion.h1
                  className="text-3xl font-bold tracking-[0.04em] text-(--na-text) sm:text-4xl md:text-5xl lg:text-[3.25rem]"
                  style={{
                    fontFamily: "var(--na-font-display)",
                    marginTop: "var(--na-space-hero-kicker)",
                  }}
                  initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={heroChild(0.06)}
                >
                  NEON ARENA
                </motion.h1>
                <motion.p
                  className="max-w-md text-sm font-normal leading-relaxed text-(--na-text-muted) md:text-base"
                  style={{ marginTop: "var(--na-space-hero-title)" }}
                  initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={heroChild(0.12)}
                >
                  Pick a cabinet. Battle fast. No account — jump straight into Tic Tac Toe or line
                  up what&apos;s next.
                </motion.p>
              </div>
            </div>
            <motion.div
              className="flex w-full shrink-0 flex-col gap-4 rounded-xl border border-(--na-border) bg-(--na-surface) p-4 shadow-(--na-glow-grid) sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-[min(100%,22rem)] lg:flex-col lg:items-stretch"
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion ? { duration: 0 } : { duration: 0.48, delay: 0.1, ease: HERO_EASE }
              }
            >
              <p
                className="text-[10px] font-semibold tracking-[0.28em] text-(--na-text-muted) uppercase sm:mr-auto lg:mr-0"
                style={{ fontFamily: "var(--na-font-display)" }}
              >
                Arena lobby
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  appearance="icon"
                  aria-label="Open settings"
                  onClick={openSettings}
                >
                  {"⚙️"}
                </Button>
                <OnlineCounter className="min-w-0 flex-1 sm:flex-initial" />
              </div>
            </motion.div>
          </div>
        </header>

        <main
          className="mx-auto max-w-6xl py-10 md:py-14 lg:py-16"
          style={{
            paddingLeft: "var(--na-space-page-x)",
            paddingRight: "var(--na-space-page-x)",
          }}
        >
          <motion.div
            className="mb-10 flex flex-col md:mb-12 lg:max-w-lg"
            style={{ gap: "var(--na-space-4)" }}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : { delay: 0.14, duration: 0.45 }}
          >
            <p
              className="text-[10px] font-medium tracking-[0.38em] text-(--na-rose) uppercase"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              Live floor
            </p>
            <motion.h2
              className="text-xl font-bold tracking-[0.06em] text-(--na-text) md:text-2xl"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              Games
            </motion.h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: "var(--na-space-8)" }}
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: reducedMotion ? 0 : 0.08 },
              },
            }}
          >
            <motion.div {...cv}>
              <GameCard
                title="Tic Tac Toe"
                thumbnail={<TicTacToeThumb />}
                onSelect={selectTicTacToe}
              />
            </motion.div>
            <motion.div {...cv}>
              <GameCard title="Chess" thumbnail={<ChessThumb />} comingSoon />
            </motion.div>
            <motion.div {...cv}>
              <GameCard title="Checkers" thumbnail={<CheckersThumb />} comingSoon />
            </motion.div>
            <motion.div {...cv}>
              <GameCard title="Connect 4" thumbnail={<Connect4Thumb />} comingSoon />
            </motion.div>
            <motion.div {...cv}>
              <GameCard title="Gomuku" thumbnail={<GomukuThumb />} comingSoon />
            </motion.div>
            <motion.div {...cv}>
              <GameCard title="Dots & Boxes" thumbnail={<DotsAndBoxesThumb />} comingSoon />
            </motion.div>
          </motion.div>
        </main>
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
