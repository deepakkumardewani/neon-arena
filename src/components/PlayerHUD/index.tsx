import { useNavigate } from "react-router-dom";

import { OnlineCounter } from "@/components/OnlineCounter";
import { useAudioStore } from "@/hooks/useAudioStore";
import { useGameStore } from "@/hooks/useGameStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { audioManager } from "@/lib/audio/audioManager";
import { hapticManager } from "@/lib/haptics/hapticManager";

function scoreLine(wins: number, losses: number, draws: number): string {
  return `W: ${wins} | L: ${losses} | D: ${draws}`;
}

export interface PlayerHUDProps {
  readonly onOpenSettings?: () => void;
  /** Mid-game leave: persist disconnect before navigating home. */
  readonly onLeaveLiveGame?: () => Promise<void> | void;
}

export function PlayerHUD({ onOpenSettings, onLeaveLiveGame }: PlayerHUDProps) {
  const navigate = useNavigate();
  const mode = useGameStore((s) => s.mode);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const nickname = usePlayerStore((s) => s.nickname);
  const localGuestNickname = usePlayerStore((s) => s.localGuestNickname);
  const score = usePlayerStore((s) => s.score);
  const masterMuted = useAudioStore((s) => s.masterMuted);
  const setMasterMuted = useAudioStore((s) => s.setMasterMuted);

  const playerXName = nickname.trim() === "" ? "Player X" : nickname;
  const playerOName =
    mode === "solo" ? "AI" : localGuestNickname.trim() === "" ? "Player O" : localGuestNickname;

  const goHome = (): void => {
    audioManager.play("click");
    hapticManager.tap();
    if (mode === "online" || mode === "friend") {
      const ok = window.confirm("Leave the live game and return home?");
      if (!ok) return;
    }
    void (async () => {
      if (onLeaveLiveGame !== undefined) {
        await onLeaveLiveGame();
      }
      void navigate("/");
    })();
  };

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-(--na-border) pb-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span
            className="truncate font-semibold"
            style={{
              color: currentTurn === "X" ? "var(--na-cyan)" : "var(--na-text-muted)",
              fontFamily: "var(--na-font-display)",
            }}
          >
            {playerXName}
            {currentTurn === "X" ? " (turn)" : ""}
          </span>
          <span className="text-(--na-text-muted)">vs</span>
          <span
            className="truncate font-semibold"
            style={{
              color: currentTurn === "O" ? "var(--na-rose)" : "var(--na-text-muted)",
              fontFamily: "var(--na-font-display)",
            }}
          >
            {playerOName}
            {currentTurn === "O" ? " (turn)" : ""}
          </span>
        </div>
        <p
          className="text-xs tracking-wide text-(--na-text-muted)"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          {scoreLine(score.wins, score.losses, score.draws)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {onOpenSettings ? (
          <button
            type="button"
            aria-label="Open settings"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-(--na-border) bg-(--na-surface) text-lg text-(--na-text) shadow-(--na-glow-grid)"
            onClick={() => {
              audioManager.play("click");
              hapticManager.tap();
              onOpenSettings();
            }}
          >
            {"\u2699\ufe0f"}
          </button>
        ) : null}
        {mode === "online" || mode === "friend" ? (
          <OnlineCounter className="scale-90 px-3 py-2 text-xs sm:scale-95" />
        ) : null}
        <button
          type="button"
          aria-label={masterMuted ? "Unmute sound" : "Mute sound"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-(--na-border) bg-(--na-surface) text-lg text-(--na-text) shadow-(--na-glow-grid)"
          onClick={() => {
            audioManager.play("click");
            hapticManager.tap();
            setMasterMuted(!masterMuted);
          }}
        >
          {masterMuted ? "\u{1F507}" : "\u{1F50A}"}
        </button>
        <button
          type="button"
          className="rounded-full border border-(--na-border) bg-(--na-surface) px-4 py-2 text-sm text-(--na-cyan)"
          style={{ fontFamily: "var(--na-font-display)" }}
          onClick={goHome}
        >
          Home
        </button>
      </div>
    </header>
  );
}
