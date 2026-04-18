import { motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ModeCard } from "@/components/ModeCard";
import { useGameStore } from "@/hooks/useGameStore";
import type { Difficulty, GameMode } from "@/types/game";

function IconVsAi() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="12" r="1.25" fill="currentColor" />
      <circle cx="15" cy="12" r="1.25" fill="currentColor" />
      <path d="M9 16h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconLocal() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
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
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.6"
      />
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
      <path d="M18 6h3M19.5 4.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export function ModeSelectPage() {
  const navigate = useNavigate();
  const setMode = useGameStore((s) => s.setMode);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

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
            className="text-[11px] tracking-[0.38em] text-(--na-purple) uppercase"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            Tic Tac Toe
          </p>
          <h1
            className="mt-3 text-3xl font-bold tracking-[0.06em] text-(--na-text) md:text-4xl lg:text-[2.75rem]"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            Choose mode
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-(--na-text-muted) md:text-base">
            Solo training, couch co-op, random matchmaking, or a private duel — pick how you want to
            play.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 flex max-w-3xl flex-col gap-4 lg:mt-14"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07 } },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
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
            {soloOpen ? (
              <motion.div
                className="mt-4 rounded-tl-xl rounded-br-xl rounded-tr-md rounded-bl-md border border-(--na-border) bg-(--na-surface) px-5 py-5 md:px-6 md:py-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
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
                      <button
                        key={d}
                        type="button"
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
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
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
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
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
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
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

        <div className="mt-12 lg:mt-14">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-(--na-cyan) transition-colors hover:text-(--na-text)"
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
