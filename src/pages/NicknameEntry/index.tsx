import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { NicknameInput, createGuestNickname, isNicknameValid } from "@/components/NicknameInput";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { authService } from "@/lib/services";
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

export function NicknameEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = parseModeParam(searchParams.get("mode"));
  const difficulty = parseDifficultyParam(searchParams.get("difficulty"));

  const setNickname = usePlayerStore((s) => s.setNickname);
  const setLocalGuestNickname = usePlayerStore((s) => s.setLocalGuestNickname);
  const setUid = usePlayerStore((s) => s.setUid);

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

  const navigateAfterNames = useCallback(async () => {
    if (mode === null) return;
    await ensurePlayerUid(setUid);
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
      void navigate("/play/tictactoe/game?mode=friend");
      return;
    }
    void navigate("/play/tictactoe/game?mode=local");
  }, [mode, difficulty, navigate, setUid]);

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
    <main className="mx-auto flex max-w-lg flex-col gap-8 p-8">
      <div>
        <p
          className="text-xs tracking-[0.2em] text-(--na-text-muted) uppercase"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          Identity
        </p>
        <h1
          className="mt-1 text-2xl text-(--na-cyan)"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          Enter nickname
        </h1>
        <p className="mt-2 text-sm text-(--na-text-muted)">{modeContextLine(mode, difficulty)}</p>
      </div>

      <NicknameInput
        id={isLocal ? `nick-${localStep}` : "nick-solo"}
        label={label}
        value={value}
        onValueChange={setValue}
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canContinue}
          className="rounded-full border border-(--na-cyan) bg-(--na-surface) px-6 py-2.5 text-sm font-semibold text-(--na-cyan) shadow-(--na-glow-grid) disabled:cursor-not-allowed disabled:border-(--na-border) disabled:text-(--na-text-muted) disabled:shadow-none"
          style={{ fontFamily: "var(--na-font-display)" }}
          onClick={() => {
            void handleContinue();
          }}
        >
          Continue
        </button>
        <Link
          to="/play/tictactoe"
          className="inline-flex items-center rounded-full border border-(--na-border) px-6 py-2.5 text-sm text-(--na-text-muted)"
        >
          Back
        </Link>
      </div>
    </main>
  );
}
