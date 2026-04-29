import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { GameCard } from "@/components/GameCard";
import { OnlineCounter } from "@/components/OnlineCounter";
import { Button } from "@/components/ui/Button";
import { ParticleBackground } from "@/components/ParticleBackground";
import { SettingsPanel } from "@/components/SettingsPanel";
import { audioManager } from "@/lib/audio/audioManager";
import { hapticManager } from "@/lib/haptics/hapticManager";

function TicTacToeThumb() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <svg viewBox="0 0 100 100" className="h-full max-h-28 w-full max-w-28" aria-hidden>
        <defs>
          <filter id="home-ttt-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="1.5"
              floodColor="var(--na-purple)"
              floodOpacity="0.5"
            />
          </filter>
        </defs>
        <g stroke="var(--na-purple)" strokeWidth="2" filter="url(#home-ttt-glow)" opacity="0.85">
          <line x1="35" y1="10" x2="35" y2="90" />
          <line x1="65" y1="10" x2="65" y2="90" />
          <line x1="10" y1="35" x2="90" y2="35" />
          <line x1="10" y1="65" x2="90" y2="65" />
        </g>
        <line
          x1="18"
          y1="18"
          x2="30"
          y2="30"
          stroke="var(--na-cyan)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="30"
          y1="18"
          x2="18"
          y2="30"
          stroke="var(--na-cyan)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="78" cy="24" r="9" fill="none" stroke="var(--na-rose)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

function PlaceholderThumb({ label }: { readonly label: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <span
        className="text-4xl font-bold text-(--na-border)"
        style={{ fontFamily: "var(--na-font-display)" }}
        aria-hidden
      >
        {label}
      </span>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="na-pregame-scene relative min-h-screen">
      <ParticleBackground />
      <div className="relative z-10 overflow-x-hidden">
        <header
          className="border-b border-(--na-border) bg-(--na-bg) px-5 py-7 md:px-8 md:py-9 lg:pl-14 lg:pr-10"
          style={{ paddingLeft: "var(--na-space-page-x)", paddingRight: "var(--na-space-page-x)" }}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <motion.div
              className="max-w-xl lg:max-w-[28rem] lg:flex-[1.15] lg:min-w-0"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-l-2 border-(--na-cyan) pl-5 md:pl-6">
                <p
                  className="text-[10px] font-medium tracking-[0.42em] text-(--na-purple) uppercase"
                  style={{
                    fontFamily: "var(--na-font-display)",
                    marginBottom: 0,
                  }}
                >
                  Insert coin
                </p>
                <h1
                  className="text-3xl font-bold tracking-[0.04em] text-(--na-text) sm:text-4xl md:text-5xl lg:text-[3.25rem]"
                  style={{
                    fontFamily: "var(--na-font-display)",
                    marginTop: "var(--na-space-hero-kicker)",
                  }}
                >
                  NEON ARENA
                </h1>
                <p
                  className="max-w-md text-sm font-normal leading-relaxed text-(--na-text-muted) md:text-base"
                  style={{ marginTop: "var(--na-space-hero-title)" }}
                >
                  Pick a cabinet. Battle fast. No account — jump straight into Tic Tac Toe or line
                  up what&apos;s next.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="flex w-full shrink-0 flex-col gap-4 rounded-xl border border-(--na-border) bg-(--na-surface) p-4 shadow-(--na-glow-grid) sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-[min(100%,22rem)] lg:flex-col lg:items-stretch"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
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
                  onClick={() => {
                    audioManager.play("click");
                    hapticManager.tap();
                    setSettingsOpen(true);
                  }}
                >
                  {"\u2699\ufe0f"}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14, duration: 0.45 }}
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
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12"
            style={{ gap: "var(--na-space-8)" }}
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.08 },
              },
            }}
          >
            <motion.div
              className="md:col-span-2 xl:col-span-5 xl:row-span-2"
              variants={{
                hidden: { opacity: 0, y: 22 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <GameCard
                title="Tic Tac Toe"
                thumbnail={<TicTacToeThumb />}
                onSelect={() => {
                  audioManager.play("click");
                  hapticManager.tap();
                  void navigate("/play/tictactoe");
                }}
              />
            </motion.div>
            <motion.div
              className="xl:col-span-4"
              variants={{
                hidden: { opacity: 0, y: 22 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <GameCard title="Chess" thumbnail={<PlaceholderThumb label="C" />} comingSoon />
            </motion.div>
            <motion.div
              className="xl:col-span-3"
              variants={{
                hidden: { opacity: 0, y: 22 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <GameCard title="Checkers" thumbnail={<PlaceholderThumb label="K" />} comingSoon />
            </motion.div>
            <motion.div
              className="md:col-span-2 xl:col-span-7 xl:col-start-6"
              variants={{
                hidden: { opacity: 0, y: 22 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <GameCard title="Battleship" thumbnail={<PlaceholderThumb label="B" />} comingSoon />
            </motion.div>
          </motion.div>
        </main>
      </div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
