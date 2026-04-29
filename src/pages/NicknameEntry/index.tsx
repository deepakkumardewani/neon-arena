import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { NicknameInput, createGuestNickname, isNicknameValid } from "@/components/NicknameInput";
import { Button } from "@/components/ui/Button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { authService, gameService } from "@/lib/services";
import type { Difficulty, GameMode } from "@/types/game";

function parseModeParam(value: string | null): GameMode | null {
  if (value === "solo" || value === "local" || value === "online" || value === "friend")
    return value;
  return null;
}

function parseDifficultyParam(value: string | null): Difficulty | null {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  return null;
}

function modeContextLine(mode: GameMode, difficulty: Difficulty | null): string {
  if (mode === "solo") {
    const d = difficulty ?? "medium";
    const label = d.charAt(0).toUpperCase() + d.slice(1);
    return `Playing: vs AI — ${label}`;
  }
  if (mode === "local") return "Playing: Local 2-player";
  if (mode === "online") return "Playing: Online matchmaking";
  return "Playing: Friend match";
}

async function ensurePlayerUid(setUid: (uid: string) => void): Promise<void> {
  const current = authService.getCurrentUser();
  if (current !== null) {
    setUid(current.uid);
    return;
  }
  const created = await authService.signInAnonymously();
  setUid(created.uid);
}

const STEP_EASE = [0.22, 1, 0.36, 1] as const;

export function NicknameEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = parseModeParam(searchParams.get("mode"));
  const difficulty = parseDifficultyParam(searchParams.get("difficulty"));
  const reducedMotion = useReducedMotion();

  const setNickname = usePlayerStore((s) => s.setNickname);
  const setLocalGuestNickname = usePlayerStore((s) => s.setLocalGuestNickname);
  const setUid = usePlayerStore((s) => s.setUid);
  const setRole = usePlayerStore((s) => s.setRole);

  const [localStep, setLocalStep] = useState<0 | 1>(0);
  const [p1Value, setP1Value] = useState(() => {
    const saved = usePlayerStore.getState().nickname;
    return saved.trim().length > 0 ? saved : createGuestNickname();
  });
  const [p2Value, setP2Value] = useState("");

  useEffect(() => {
    if (mode === null) {
      void navigate("/play/tictactoe", { replace: true });
    }
  }, [mode, navigate]);

  const isLocal = mode === "local";
  const onP1Field = localStep === 0 || !isLocal;
  const value = onP1Field ? p1Value : p2Value;
  const setValue = onP1Field ? setP1Value : setP2Value;
  const label = isLocal ? (localStep === 0 ? "Player 1" : "Player 2") : "Your nickname";

  const joinGameId = searchParams.get("joinGameId");

  const navigateAfterNames = useCallback(async () => {
    if (mode === null) return;
    await ensurePlayerUid(setUid);
    const store = usePlayerStore.getState();
    const playerUid = store.uid;
    const trimmedNick = store.nickname.trim() === "" ? "Player" : store.nickname.trim();
    if (mode === "online") {
      void navigate("/play/tictactoe/matchmaking");
      return;
    }
    if (mode === "solo") {
      const d = difficulty ?? "medium";
      void navigate(`/play/tictactoe/game?mode=solo&difficulty=${d}`);
      return;
    }
    if (mode === "friend") {
      if (joinGameId !== null && joinGameId !== "") {
        await gameService.joinGame(joinGameId, { uid: playerUid, nickname: trimmedNick });
        setRole("O");
        void navigate(`/game/${joinGameId}?mode=friend`);
        return;
      }
      const id = await gameService.createGame({ uid: playerUid, nickname: trimmedNick });
      setRole("X");
      void navigate(`/game/${id}?mode=friend`);
      return;
    }
    void navigate("/play/tictactoe/game?mode=local");
  }, [difficulty, joinGameId, mode, navigate, setRole, setUid]);

  const handleContinue = useCallback(async () => {
    if (mode === null) return;
    if (!isNicknameValid(value)) return;

    if (isLocal && localStep === 0) {
      setNickname(value.trim());
      await ensurePlayerUid(setUid);
      const guestSaved = usePlayerStore.getState().localGuestNickname;
      setP2Value(guestSaved.trim().length > 0 ? guestSaved : createGuestNickname());
      setLocalStep(1);
      return;
    }

    if (isLocal && localStep === 1) {
      setLocalGuestNickname(value.trim());
      await navigateAfterNames();
      return;
    }

    setNickname(value.trim());
    await navigateAfterNames();
  }, [
    isLocal,
    localStep,
    mode,
    navigateAfterNames,
    setLocalGuestNickname,
    setNickname,
    setUid,
    value,
  ]);

  if (mode === null) {
    return null;
  }

  const canContinue = isNicknameValid(value);

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
      <main
        className="mx-auto flex w-full max-w-xl flex-1 flex-col lg:ml-8 lg:mr-auto lg:max-w-lg xl:ml-12"
        style={{ gap: "var(--na-space-10)" }}
      >
        <motion.div
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.42, ease: STEP_EASE }}
        >
          <div className="border-l-2 border-(--na-rose) pl-5 md:pl-6">
            <p
              className="text-[11px] tracking-[0.32em] text-(--na-text-muted) uppercase"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              Identity
            </p>
            <h1
              className="mt-3 text-2xl font-bold tracking-[0.05em] text-(--na-cyan) md:text-3xl"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              Enter nickname
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-(--na-text-muted) md:text-base">
              {modeContextLine(mode, difficulty)}
            </p>
          </div>
          {isLocal ? (
            <div
              className="inline-flex w-fit max-w-full flex-wrap items-center gap-2 rounded-md border border-(--na-border) bg-(--na-bg) px-3 py-2"
              style={{ marginTop: "var(--na-space-8)" }}
              aria-label={`Step ${localStep + 1} of 2`}
            >
              <span
                className="text-[10px] font-semibold tracking-[0.32em] text-(--na-purple) uppercase"
                style={{ fontFamily: "var(--na-font-display)" }}
              >
                Progress
              </span>
              <span className="hidden h-4 w-px shrink-0 bg-(--na-border) sm:inline" aria-hidden />
              <p
                className="text-xs font-bold tracking-[0.2em] text-(--na-text) uppercase"
                style={{ fontFamily: "var(--na-font-display)" }}
              >
                Step {localStep + 1} of 2
              </p>
            </div>
          ) : null}
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isLocal ? `step-${localStep}` : "solo-flow"}
            initial={
              reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 36 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -36 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.26, ease: STEP_EASE }
            }
          >
            <NicknameInput
              id={isLocal ? `nick-${localStep}` : "nick-solo"}
              label={label}
              value={value}
              onValueChange={setValue}
            />
          </motion.div>
        </AnimatePresence>

        <motion.div
          className="mt-auto flex flex-wrap items-center pt-2"
          style={{ gap: "var(--na-space-7)" }}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            reducedMotion ? { duration: 0 } : { delay: 0.12, duration: 0.35 }
          }
        >
          <motion.span
            className="inline-block"
            tabIndex={-1}
            whileTap={reducedMotion ? undefined : { scale: 0.96 }}
            transition={{ type: "spring", stiffness: 520, damping: 28 }}
          >
            <Button
              type="button"
              unstyled
              disabled={!canContinue}
              className="rounded-tl-full rounded-br-full rounded-tr-full rounded-bl-full border-2 border-(--na-cyan) bg-(--na-surface) px-10 py-3.5 text-base font-bold text-(--na-cyan) shadow-(--na-glow-grid) transition-opacity disabled:border-(--na-border) disabled:text-(--na-text-muted) disabled:shadow-none"
              style={{ fontFamily: "var(--na-font-display)" }}
              onClick={() => {
                void handleContinue();
              }}
            >
              Continue
            </Button>
          </motion.span>
          <Link
            to="/play/tictactoe"
            className="inline-flex items-center rounded-tl-full rounded-br-full rounded-tr-full rounded-bl-full border-2 border-(--na-border) px-6 py-3 text-sm font-medium text-(--na-text) transition-colors hover:border-(--na-purple) hover:text-(--na-text)"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            Back
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
