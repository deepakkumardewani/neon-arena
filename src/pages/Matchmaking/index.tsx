import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { useMatchmaking } from "@/hooks/useMatchmaking";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { getMatchmakingQueueEntryId } from "@/lib/matchmaking/queueEntryId";
import { queueService } from "@/lib/services";
import type { GameConfig } from "@/types/game";

const AI_FALLBACK_MS = 30_000;

interface MatchmakingPageProps {
  readonly gameConfig: GameConfig;
}

export function MatchmakingPage({ gameConfig }: MatchmakingPageProps) {
  const navigate = useNavigate();
  const uid = usePlayerStore((s) => s.uid);
  const nickname = usePlayerStore((s) => s.nickname);
  const queueEntryId = useMemo(() => getMatchmakingQueueEntryId(uid), [uid]);
  const { queueDepth } = useMatchmaking();

  const [showAiFallback, setShowAiFallback] = useState(false);

  useEffect(() => {
    const trimmed = nickname.trim();
    if (uid.length > 0 && trimmed.length > 0 && queueEntryId.length > 0) {
      void queueService.enqueue(queueEntryId, uid, trimmed);
    }
    return () => {
      if (queueEntryId.length > 0) {
        void queueService.dequeue(queueEntryId);
      }
    };
  }, [uid, nickname, queueEntryId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setShowAiFallback(true);
    }, AI_FALLBACK_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div
      className="na-pregame-scene flex min-h-screen flex-col overflow-x-hidden"
      style={{
        paddingLeft: "var(--na-space-page-x)",
        paddingRight: "var(--na-space-page-x)",
        paddingTop: "var(--na-space-page-y)",
        paddingBottom: "var(--na-space-section)",
      }}
    >
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col lg:ml-6 lg:mr-auto lg:max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="text-[11px] tracking-[0.36em] text-(--na-purple) uppercase"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            Online
          </p>
          <h1
            className="mt-3 text-3xl font-bold tracking-[0.05em] text-(--na-text) md:text-4xl"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            Matchmaking
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-(--na-text-muted) md:text-base">
            Scanning the neon pool for another pilot. Hold tight — the queue moves fast.
          </p>
        </motion.div>

        <motion.div
          className="relative mt-12 flex flex-col items-start gap-10 md:mt-14 md:flex-row md:items-center md:gap-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.45 }}
        >
          <div className="relative flex h-44 w-44 shrink-0 items-center justify-center md:h-52 md:w-52">
            <div
              className="absolute size-[5.5rem] rounded-full border border-(--na-border) md:size-24"
              aria-hidden
            />
            <div
              className="absolute size-[5.5rem] rounded-full border border-(--na-purple) opacity-35 md:size-24"
              style={{ transform: "rotate(12deg)" }}
              aria-hidden
            />
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="na-radar-ring pointer-events-none absolute size-[5.5rem] rounded-full border border-(--na-cyan) md:size-24"
                style={{ animationDelay: `${i * 0.75}s` }}
                aria-hidden
              />
            ))}
            <span
              className="relative z-10 size-3 rounded-full bg-(--na-cyan) shadow-(--na-glow-grid)"
              aria-hidden
            />
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="rounded-tl-xl rounded-br-xl rounded-tr-md rounded-bl-md border border-(--na-border) bg-(--na-surface) px-5 py-4 md:px-6 md:py-5">
              <p
                className="text-[11px] tracking-[0.22em] text-(--na-text-muted) uppercase"
                style={{ fontFamily: "var(--na-font-display)" }}
              >
                Queue telemetry
              </p>
              <p
                className="mt-3 text-2xl font-semibold tabular-nums text-(--na-cyan) md:text-3xl"
                style={{ fontFamily: "var(--na-font-display)" }}
              >
                {queueDepth}
                <span className="ml-2 text-sm font-normal tracking-normal text-(--na-text-muted) md:text-base">
                  players waiting
                </span>
              </p>
            </div>

            <p className="text-sm text-(--na-text-muted)">
              Queue updates live — two pilots in the pool pair into a fresh match automatically.
            </p>
          </div>
        </motion.div>

        {showAiFallback ? (
          <motion.div
            className="mt-10 rounded-tl-xl rounded-br-xl border-2 border-(--na-rose) bg-(--na-surface) px-5 py-5 md:px-6 md:py-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-base font-medium text-(--na-text) md:text-lg"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              No opponent found — play vs AI instead?
            </p>
            <p className="mt-2 text-sm text-(--na-text-muted)">
              Drop into a solo cabinet on Medium difficulty. You can always queue again later.
            </p>
            <Button
              type="button"
              unstyled
              className="mt-5 rounded-tl-full rounded-br-full rounded-tr-full rounded-bl-full border-2 border-(--na-rose) bg-(--na-bg) px-6 py-2.5 text-sm font-semibold text-(--na-rose) transition-colors hover:bg-(--na-surface)"
              style={{ fontFamily: "var(--na-font-display)" }}
              onClick={() => {
                void navigate(`${gameConfig.routePrefix}/game?mode=solo&difficulty=medium`);
              }}
            >
              Play vs AI
            </Button>
          </motion.div>
        ) : null}

        <div className="mt-auto pt-12">
          <Link
            to={`${gameConfig.routePrefix}/nickname?mode=online`}
            className="inline-flex items-center gap-2 text-sm font-medium text-(--na-cyan) transition-colors hover:text-(--na-text)"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            <span aria-hidden>←</span> Leave queue
          </Link>
        </div>
      </main>
    </div>
  );
}
