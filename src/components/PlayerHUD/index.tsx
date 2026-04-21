import { useNavigate } from "react-router-dom";

import { OnlineCounter } from "@/components/OnlineCounter";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/confirm";
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
  /** Friend mode before play: show this instead of X vs O (share / connecting / redirect). */
  readonly prematchHeadline?: string | null;
}

export function PlayerHUD({
  onOpenSettings,
  onLeaveLiveGame,
  prematchHeadline = null,
}: PlayerHUDProps) {
  const navigate = useNavigate();
  const mode = useGameStore((s) => s.mode);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const onlineHudNames = useGameStore((s) => s.onlineHudNames);
  const nickname = usePlayerStore((s) => s.nickname);
  const localGuestNickname = usePlayerStore((s) => s.localGuestNickname);
  const score = usePlayerStore((s) => s.score);
  const masterMuted = useAudioStore((s) => s.masterMuted);
  const setMasterMuted = useAudioStore((s) => s.setMasterMuted);
  const { confirm } = useConfirm();

  const useNetworkHud = mode === "online" || mode === "friend";

  const playerXName = useNetworkHud
    ? (onlineHudNames?.x ?? "…")
    : nickname.trim() === ""
      ? "Player X"
      : nickname;

  const playerOName = useNetworkHud
    ? (onlineHudNames?.o ?? "Waiting…")
    : mode === "solo"
      ? "AI"
      : localGuestNickname.trim() === ""
        ? "Player O"
        : localGuestNickname;

  const goHome = (): void => {
    audioManager.play("click");
    hapticManager.tap();
    void (async () => {
      if (mode === "online" || mode === "friend") {
        const ok = await confirm({ message: "Leave the live game and return home?" });
        if (!ok) return;
      }
      if (onLeaveLiveGame !== undefined) {
        await onLeaveLiveGame();
      }
      void navigate("/");
    })();
  };

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-(--na-border) pb-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {prematchHeadline !== null && prematchHeadline !== "" ? (
          <p
            className="text-sm text-(--na-text-muted)"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            {prematchHeadline}
          </p>
        ) : (
          <>
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
          </>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {onOpenSettings ? (
          <Button
            type="button"
            appearance="icon"
            aria-label="Open settings"
            onClick={() => {
              audioManager.play("click");
              hapticManager.tap();
              onOpenSettings();
            }}
          >
            {"\u2699\ufe0f"}
          </Button>
        ) : null}
        {mode === "online" || mode === "friend" ? (
          <OnlineCounter className="scale-90 px-3 py-2 text-xs sm:scale-95" />
        ) : null}
        <Button
          type="button"
          appearance="icon"
          aria-label={masterMuted ? "Unmute sound" : "Mute sound"}
          onClick={() => {
            audioManager.play("click");
            hapticManager.tap();
            setMasterMuted(!masterMuted);
          }}
        >
          {masterMuted ? "\u{1F507}" : "\u{1F50A}"}
        </Button>
        <Button
          type="button"
          tone="surface"
          style={{ fontFamily: "var(--na-font-display)" }}
          className="px-4"
          onClick={goHome}
        >
          Home
        </Button>
      </div>
    </header>
  );
}
