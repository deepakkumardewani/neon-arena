import { useNavigate } from "react-router-dom";

import { OnlineCounter } from "@/components/OnlineCounter";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/confirm";
import { useAudioStore } from "@/hooks/useAudioStore";
import { useGameStore } from "@/hooks/useGameStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { audioManager } from "@/lib/audio/audioManager";
import { hapticManager } from "@/lib/haptics/hapticManager";

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
    <header
      className="mb-6 rounded-xl border border-(--na-border) bg-(--na-surface) px-3 py-4 sm:px-5 sm:py-5"
      style={{ boxShadow: "var(--na-glow-grid)" }}
    >
      <div
        className="flex flex-wrap items-start justify-between gap-y-4"
        style={{ gap: "var(--na-space-8)" }}
      >
        <div className="flex min-w-0 flex-1 flex-col" style={{ gap: "var(--na-space-6)" }}>
          {prematchHeadline !== null && prematchHeadline !== "" ? (
            <p
              className="text-base text-(--na-text-muted) md:text-lg"
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              {prematchHeadline}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span
                  className="min-w-0 max-w-[min(100%,14rem)] truncate text-base font-bold md:text-lg"
                  style={{
                    color: currentTurn === "X" ? "var(--na-cyan)" : "var(--na-text-muted)",
                    fontFamily: "var(--na-font-display)",
                  }}
                >
                  {playerXName}
                  {currentTurn === "X" ? (
                    <span className="text-xs font-semibold text-(--na-text-muted)"> (turn)</span>
                  ) : null}
                </span>
                <span className="text-sm font-semibold text-(--na-text-muted)">vs</span>
                <span
                  className="min-w-0 max-w-[min(100%,14rem)] truncate text-base font-bold md:text-lg"
                  style={{
                    color: currentTurn === "O" ? "var(--na-rose)" : "var(--na-text-muted)",
                    fontFamily: "var(--na-font-display)",
                  }}
                >
                  {playerOName}
                  {currentTurn === "O" ? (
                    <span className="text-xs font-semibold text-(--na-text-muted)"> (turn)</span>
                  ) : null}
                </span>
              </div>
              <div
                className="flex flex-wrap items-center border-t border-(--na-border) pt-3"
                style={{ gap: "var(--na-space-7)" }}
              >
                <span
                  className="text-[10px] font-semibold tracking-[0.22em] text-(--na-text-muted) uppercase"
                  style={{ fontFamily: "var(--na-font-display)" }}
                >
                  Session record
                </span>
                <div className="flex flex-wrap tabular-nums" style={{ gap: "var(--na-space-7)" }}>
                  <span className="text-sm md:text-base">
                    <span
                      className="text-(--na-text-muted)"
                      style={{ fontFamily: "var(--na-font-display)" }}
                    >
                      W{" "}
                    </span>
                    <strong
                      className="font-bold text-(--na-text)"
                      style={{ fontFamily: "var(--na-font-display)" }}
                    >
                      {score.wins}
                    </strong>
                  </span>
                  <span className="text-sm md:text-base">
                    <span
                      className="text-(--na-text-muted)"
                      style={{ fontFamily: "var(--na-font-display)" }}
                    >
                      L{" "}
                    </span>
                    <strong
                      className="font-bold text-(--na-text)"
                      style={{ fontFamily: "var(--na-font-display)" }}
                    >
                      {score.losses}
                    </strong>
                  </span>
                  <span className="text-sm md:text-base">
                    <span
                      className="text-(--na-text-muted)"
                      style={{ fontFamily: "var(--na-font-display)" }}
                    >
                      D{" "}
                    </span>
                    <strong
                      className="font-bold text-(--na-text)"
                      style={{ fontFamily: "var(--na-font-display)" }}
                    >
                      {score.draws}
                    </strong>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div
          className="flex shrink-0 flex-wrap items-center rounded-lg border border-(--na-border) bg-(--na-bg) p-1.5"
          style={{ gap: "var(--na-space-3)" }}
        >
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
      </div>
    </header>
  );
}
