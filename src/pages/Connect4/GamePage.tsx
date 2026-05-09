import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { Connect4Board } from "@/components/connect4/Connect4Board";
import { Connect4HUD } from "@/components/connect4/Connect4HUD";
import { Connect4ScoreBoard } from "@/components/connect4/Connect4ScoreBoard";
import { Connect4SettingsSection, SettingsPanel } from "@/components/SettingsPanel";
import { ConnectionLostBanner } from "@/components/ConnectionLostBanner";
import { WinOverlay } from "@/components/WinOverlay";

import { useConnect4Store } from "@/lib/connect4/state/useConnect4Store";
import { useConnect4Settings } from "@/lib/connect4/state/useConnect4Settings";
import { useConnect4AI } from "@/lib/connect4/engine/useConnect4AI";
import { useConnect4HintSystem } from "@/lib/connect4/hints/useConnect4HintSystem";
import { useConnect4Online } from "@/lib/connect4/online/useConnect4Online";
import { useFirebaseConnected } from "@/hooks/useFirebaseConnected";
import type { Difficulty } from "@/lib/connect4/engine/difficultyMap";
import type { GameMode } from "@/types/game";

// ── Param helpers ─────────────────────────────────────────────────────────────

function parseMode(value: string | null): GameMode {
  if (value === "solo" || value === "local" || value === "online" || value === "friend")
    return value;
  return "solo";
}

function parseDifficulty(value: string | null): Difficulty {
  const d = (value ?? "medium") as Difficulty;
  return ["easy", "medium", "hard"].includes(d) ? d : "medium";
}

// ── Win overlay helpers ───────────────────────────────────────────────────────

function deriveOverlay(
  status: string,
  isDraw: boolean,
  winner: 1 | 2 | null,
  mode: GameMode,
  isNetworked: boolean,
) {
  if (status !== "finished")
    return { open: false, headline: "", palette: "cyan" as const, celebrate: false };

  if (isDraw) {
    return { open: true, headline: "Draw!", palette: "purple" as const, celebrate: false };
  }

  if (winner === 1) {
    if (isNetworked) {
      return { open: true, headline: "Player 1 Wins!", palette: "cyan" as const, celebrate: false };
    }
    const headline = mode === "local" ? "Player 1 Wins!" : "You Win!";
    return { open: true, headline, palette: "cyan" as const, celebrate: true };
  }

  if (winner === 2) {
    if (isNetworked) {
      return { open: true, headline: "Player 2 Wins!", palette: "rose" as const, celebrate: false };
    }
    const headline = mode === "local" ? "Player 2 Wins!" : "AI Wins!";
    return { open: true, headline, palette: "rose" as const, celebrate: mode === "local" };
  }

  return { open: false, headline: "", palette: "cyan" as const, celebrate: false };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Connect4GamePage() {
  const navigate = useNavigate();
  const { gameId: routeGameId } = useParams();
  const [searchParams] = useSearchParams();

  const modeParam = parseMode(searchParams.get("mode"));
  const difficulty = parseDifficulty(searchParams.get("difficulty"));

  // Determine effective gameId and mode
  const effectiveGameId = routeGameId !== undefined && routeGameId !== "" ? routeGameId : undefined;
  const mode: GameMode = effectiveGameId ? "friend" : modeParam;

  const isNetworked = mode === "online" || mode === "friend";
  const isNetworkedWithGame = isNetworked && effectiveGameId !== undefined;

  // ── Store ─────────────────────────────────────────────────────────────────

  const { state, dropDisc, undoMove, resetGame, startGame, requestHint } = useConnect4Store();
  const { status, currentPlayer, winResult, isDraw } = state;

  // Start game on mount (not for networked games — remote state drives it)
  useEffect(() => {
    if (!isNetworkedWithGame) {
      startGame();
    }
    return () => {
      resetGame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Settings ───────────────────────────────────────────────────────────────

  const [settingsOpen, setSettingsOpen] = useState(false);
  const allowUndo = useConnect4Settings((s) => s.allowUndo);
  const hintsEnabled = useConnect4Settings((s) => s.hintsEnabled);
  const animationSpeedMs = useConnect4Settings((s) => s.animationSpeedMs);

  // ── Online hook ────────────────────────────────────────────────────────────

  const {
    commitMoveToFirebase,
    resignGame,
    acceptRematch,
    declineRematch,
    notifyLeaveGame,
    myPlayerId,
    p1Name,
    p2Name,
  } = useConnect4Online({ gameId: effectiveGameId, mode });

  const firebaseConnected = useFirebaseConnected(isNetworkedWithGame);
  const networkPlayBlocked = isNetworked && firebaseConnected === false;

  // ── Post-move callback for online writes ───────────────────────────────────

  const onlineWriteBusy = useRef(false);
  const prevHistoryLen = useRef(state.history.length);

  useEffect(() => {
    if (!isNetworkedWithGame) return;
    if (state.history.length <= prevHistoryLen.current) {
      prevHistoryLen.current = state.history.length;
      return;
    }
    prevHistoryLen.current = state.history.length;
    if (onlineWriteBusy.current) return;

    onlineWriteBusy.current = true;
    void commitMoveToFirebase().finally(() => {
      onlineWriteBusy.current = false;
    });
  }, [isNetworkedWithGame, state.history.length, commitMoveToFirebase]);

  // ── AI (solo mode only) ───────────────────────────────────────────────────

  const isGameOver = status === "finished";
  const isPlayerTurn =
    mode === "solo"
      ? currentPlayer === 1
      : mode === "local"
        ? true
        : isNetworked
          ? myPlayerId === currentPlayer
          : true;

  const handleAiDrop = useCallback(
    (col: number) => {
      dropDisc(col, animationSpeedMs);
    },
    [dropDisc, animationSpeedMs],
  );

  const { isThinking } = useConnect4AI(state, difficulty, {
    onDropDisc: handleAiDrop,
    isPlayerTurn: mode !== "solo" || isPlayerTurn || isGameOver,
  });

  // ── Hint system (solo only) ───────────────────────────────────────────────

  const { secondsUntilAutoHint, onUserActivity } = useConnect4HintSystem({
    isThinking: mode !== "solo" || isThinking,
  });

  // ── Undo ─────────────────────────────────────────────────────────────────

  const canUndo = allowUndo && (mode === "solo" || mode === "local");

  const handleUndo = useCallback(() => {
    if (!canUndo || isThinking) return;
    undoMove(mode === "solo" ? "solo" : "local");
  }, [canUndo, isThinking, undoMove, mode]);

  // ── Play again / Home ─────────────────────────────────────────────────────

  const handlePlayAgain = useCallback(() => {
    if (isNetworkedWithGame) {
      void acceptRematch();
      return;
    }
    resetGame();
    startGame();
  }, [acceptRematch, isNetworkedWithGame, resetGame, startGame]);

  const handleHome = useCallback(() => {
    if (isNetworkedWithGame) {
      void declineRematch();
    }
    void navigate("/play/connect4");
  }, [declineRematch, isNetworkedWithGame, navigate]);

  // ── Resign ─────────────────────────────────────────────────────────────────

  const handleResign = useCallback(() => {
    if (!isNetworkedWithGame) return;
    void resignGame();
  }, [isNetworkedWithGame, resignGame]);

  // ── Win overlay ───────────────────────────────────────────────────────────

  const overlay = deriveOverlay(status, isDraw, winResult?.winner ?? null, mode, isNetworked);

  // ── Labels ────────────────────────────────────────────────────────────────

  const p1Label = isNetworked ? p1Name : mode === "solo" ? "You" : "Player 1";
  const p2Label = isNetworked ? p2Name : mode === "solo" ? `AI (${difficulty})` : "Player 2";

  const modeLabel = isNetworked
    ? mode === "friend"
      ? "Friend"
      : "Online"
    : mode === "solo"
      ? `Solo · ${difficulty}`
      : "Local";

  const boardDisabled =
    isThinking ||
    (mode === "solo" && currentPlayer === 2) ||
    (isNetworked && !isNetworkedWithGame) ||
    networkPlayBlocked;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden bg-(--na-bg)"
      onPointerMove={onUserActivity}
    >
      {/* Connection lost banner */}
      {networkPlayBlocked ? <ConnectionLostBanner /> : null}

      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-(--na-border) px-4 py-2">
        <button
          type="button"
          onClick={() => {
            if (isNetworkedWithGame) {
              void notifyLeaveGame();
            }
            void navigate("/play/connect4");
          }}
          className="text-sm text-(--na-text-muted) hover:text-(--na-text) transition-colors"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          ← Connect 4
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded border border-(--na-border) px-2 py-1 text-xs text-(--na-text-muted) transition-all hover:border-(--na-purple) hover:text-(--na-purple)"
            style={{ fontFamily: "var(--na-font-display)" }}
            aria-label="Open settings"
          >
            ⚙
          </button>
          <span
            className="text-xs tracking-widest text-(--na-text-muted) uppercase"
            style={{ fontFamily: "var(--na-font-display)" }}
          >
            {modeLabel}
          </span>
          {isNetworkedWithGame && !isGameOver ? (
            <button
              type="button"
              onClick={handleResign}
              className="ml-2 rounded border border-(--na-rose) px-2 py-1 text-xs text-(--na-rose) transition-all hover:bg-(--na-rose) hover:text-(--na-bg)"
              style={{ fontFamily: "var(--na-font-display)" }}
              aria-label="Resign"
            >
              Resign
            </button>
          ) : null}
        </div>
      </div>

      {/* Main layout */}
      <div
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:items-start lg:justify-center lg:overflow-hidden"
        onClick={onUserActivity}
      >
        {/* Board column */}
        <div className="flex flex-col items-center gap-3 lg:flex-1 lg:min-w-0">
          <Connect4ScoreBoard gameState={state} p1Label={p1Label} p2Label={p2Label} />
          <Connect4Board
            isThinking={
              isThinking ||
              (isNetworked && currentPlayer !== myPlayerId && !isGameOver) ||
              boardDisabled
            }
          />
        </div>

        {/* Sidebar */}
        <div className="flex w-full flex-col gap-3 lg:w-72">
          <Connect4HUD
            p1Label={p1Label}
            p2Label={p2Label}
            hintsEnabled={mode === "solo" && hintsEnabled}
            secondsUntilAutoHint={mode === "solo" ? secondsUntilAutoHint : null}
            onRequestHint={requestHint}
            onUndo={handleUndo}
            isThinking={isThinking || (isNetworked && currentPlayer !== myPlayerId && !isGameOver)}
            showUndo={canUndo}
          />
        </div>
      </div>

      {/* Win overlay */}
      <WinOverlay
        open={overlay.open}
        headline={overlay.headline}
        palette={overlay.palette}
        celebrate={overlay.celebrate}
        onPlayAgain={handlePlayAgain}
        onHome={handleHome}
      />

      {/* Settings panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <Connect4SettingsSection />
      </SettingsPanel>
    </div>
  );
}
