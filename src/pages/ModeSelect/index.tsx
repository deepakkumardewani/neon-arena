import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ModeCard } from "@/components/ModeCard";
import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/hooks/useGameStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Difficulty, GameMode } from "@/types/game";

function IconVsAi() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle className="na-mode-ai-eye" cx="9" cy="12" r="1.25" fill="currentColor" />
      <circle className="na-mode-ai-eye" cx="15" cy="12" r="1.25" fill="currentColor" />
      <path d="M9 16h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconLocal() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        className="na-mode-local-left"
        cx="9"
        cy="9"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        className="na-mode-local-right"
        cx="16"
        cy="9"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 20c0-3 3.5-5 8-5s8 2 8 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconOnline() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <g className="na-mode-online-globe">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

function IconFriend() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15c-2.5 0-4.5 1.5-5.5 3.5h11c-1-2-3-3.5-5.5-3.5zM12 13a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        className="na-mode-friend-plus"
        d="M18 6h3M19.5 4.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

const STAGGER_SEC = 0.05;
const MODE_CARD_EASE = [0.22, 1, 0.36, 1] as const;

export function ModeSelectPage() {
  const navigate = useNavigate();
  const setMode = useGameStore((s) => s.setMode);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const reducedMotion = useReducedMotion();

  const [soloOpen, setSoloOpen] = useState(false);
  const [soloDifficulty, setSoloDifficulty] = useState<Difficulty>("medium");

  const goNickname = useCallback(
    (mode: GameMode, difficulty?: Difficulty) => {
      setMode(mode);
      if (mode === "solo" && difficulty !== undefined) {
        setDifficulty(difficulty);
        void navigate(`/play/tictactoe/nickname?mode=solo&difficulty=${difficulty}`);
        return;
      }
      void navigate(`/play/tictactoe/nickname?mode=${mode}`);
    },
    [navigate, setDifficulty, setMode],
  );

  const onPickMode = useCallback(
    (mode: GameMode) => {
      if (mode === "solo") {
        setSoloOpen(true);
        return;
      }
      goNickname(mode);
    },
    [goNickname],
  );

  return (
    <div
      className="na-pregame-scene min-h-screen overflow-x-hidden"
      style={{
        paddingLeft: "var(--na-space-page-x)",
        paddingRight: "var(--na-space-page-x)",
        paddingTop: "var(--na-space-page-y)",
        paddingBottom: "var(--na-space-section)",
      }}
    >
      <div className="mx-auto max-w-4xl lg:mr-8 lg:ml-4 xl:max-w-5xl">
        <motion.div
          className="max-w-2xl border-l-2 border-(--na-purple) pl-5 md:pl-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="text-[10px] font-medium tracking-[0.38em] text-(--na-purple) uppercase"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            Tic Tac Toe
          </p>
          <h1
            className="text-3xl font-bold tracking-[0.06em] text-(--na-text) md:text-4xl lg:text-[2.75rem]"
            style={{
              fontFamily: "var(--na-font-display)",
              marginTop: "var(--na-space-6)",
            }}
          >
            Choose mode
          </h1>
          <p
            className="max-w-xl text-sm leading-relaxed text-(--na-text-muted) md:text-base"
            style={{ marginTop: "var(--na-space-10)" }}
          >
            Solo training, couch co-op, random matchmaking, or a private duel — pick how you want to
            play.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 flex max-w-3xl flex-col lg:mt-14"
          style={{ gap: "var(--na-space-8)" }}
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reducedMotion ? 0 : STAGGER_SEC } },
          }}
        >
          <motion.div
            variants={{
              hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{
              duration: reducedMotion ? 0 : 0.36,
              ease: MODE_CARD_EASE,
            }}
          >
            <ModeCard
              icon={<IconVsAi />}
              title="vs AI"
              description="Train against the machine — pick a difficulty that matches your ego."
              selected={soloOpen}
              onClick={() => {
                onPickMode("solo");
              }}
            />
            <motion.div
              className="overflow-hidden"
              initial={false}
              animate={{
                height: soloOpen ? "auto" : 0,
                opacity: soloOpen ? 1 : 0,
              }}
              transition={
                reducedMotion ? { duration: 0 } : { duration: 0.28, ease: MODE_CARD_EASE }
              }
              aria-hidden={!soloOpen}
            >
              <div className="ml-3 mt-2 rounded-lg border border-(--na-border) border-l-[3px] border-l-(--na-purple) bg-(--na-surface) px-4 py-4 md:ml-6 md:mt-3 md:px-5 md:py-5">
                <p
                  className="text-[11px] tracking-[0.28em] text-(--na-text-muted) uppercase"
                  style={{ fontFamily: "var(--na-font-display)" }}
                >
                  Difficulty
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {DIFFICULTIES.map((d) => {
                    const label = d.charAt(0).toUpperCase() + d.slice(1);
                    const active = soloDifficulty === d;
                    return (
                      <Button
                        key={d}
                        type="button"
                        unstyled
                        onClick={() => {
                          setSoloDifficulty(d);
                          goNickname("solo", d);
                        }}
                        className={`rounded-tl-full rounded-br-full rounded-tr-full rounded-bl-full border-2 px-5 py-2.5 text-sm font-medium transition-[border-color,box-shadow,color] ${
                          active
                            ? "border-(--na-cyan) bg-(--na-bg) text-(--na-cyan) shadow-(--na-glow-grid)"
                            : "border-(--na-border) text-(--na-text-muted) hover:border-(--na-purple) hover:text-(--na-text)"
                        }`}
                        style={{ fontFamily: "var(--na-font-display)" }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={{
              hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{
              duration: reducedMotion ? 0 : 0.36,
              ease: MODE_CARD_EASE,
            }}
          >
            <ModeCard
              icon={<IconLocal />}
              title="Local 2P"
              description="Pass the phone — same screen, old-school arcade energy."
              onClick={() => {
                setSoloOpen(false);
                onPickMode("local");
              }}
            />
          </motion.div>

          <motion.div
            variants={{
              hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{
              duration: reducedMotion ? 0 : 0.36,
              ease: MODE_CARD_EASE,
            }}
          >
            <ModeCard
              icon={<IconOnline />}
              title="Online Random"
              description="Queue into the neon matchmaking pool and fight a stranger."
              onClick={() => {
                setSoloOpen(false);
                onPickMode("online");
              }}
            />
          </motion.div>

          <motion.div
            variants={{
              hidden: reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{
              duration: reducedMotion ? 0 : 0.36,
              ease: MODE_CARD_EASE,
            }}
          >
            <ModeCard
              icon={<IconFriend />}
              title="Play with Friend"
              description="Host a room and share a link — they join as O."
              onClick={() => {
                setSoloOpen(false);
                onPickMode("friend");
              }}
            />
          </motion.div>
        </motion.div>

        <div className="mt-14 lg:mt-16">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-(--na-text) transition-colors hover:text-(--na-cyan)"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            Back to arena
          </Link>
        </div>
      </div>
    </div>
  );
}
