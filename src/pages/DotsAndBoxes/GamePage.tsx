import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { DotsBoard } from "@/components/dotsAndBoxes/DotsBoard";
import { DotsHUD } from "@/components/dotsAndBoxes/DotsHUD";
import { DotsScoreBoard } from "@/components/dotsAndBoxes/ScoreBoard";
import { BoardSizePicker } from "@/components/dotsAndBoxes/BoardSizePicker";
import { ConnectionLostBanner } from "@/components/ConnectionLostBanner";
import { SettingsPanel, DotsSettingsSection } from "@/components/SettingsPanel";
import { GameEndOverlay } from "@/components/WinOverlay";

import { useDotsStore } from "@/lib/dotsAndBoxes/state/useDotsStore";
import { useDotsSettings } from "@/lib/dotsAndBoxes/state/useDotsSettings";
import { useDotsAI } from "@/lib/dotsAndBoxes/engine/useDotsAI";
import { useDotsHintSystem } from "@/lib/dotsAndBoxes/hints/useDotsHintSystem";
import { useDotsOnline } from "@/lib/dotsAndBoxes/online/useDotsOnline";
import { useFirebaseConnected } from "@/hooks/useFirebaseConnected";
import type { GameMode } from "@/types/game";
import type { Difficulty } from "@/lib/dotsAndBoxes/engine/difficultyMap";

function parseMode(value: string | null): GameMode | null {
  if (value === "solo" || value === "local" || value === "online" || value === "friend")
    return value;
  return null;
}

function parseDifficulty(value: string | null): Difficulty {
  const d = (value ?? "medium") as Difficulty;
  return ["easy", "medium", "hard"].includes(d) ? d : "medium";
}

export function DotsAndBoxesGamePage() {
  const navigate = useNavigate();
  const { gameId: routeGameId } = useParams();
  const [searchParams] = useSearchParams();

  const modeParam = parseMode(searchParams.get("mode"));
  const difficulty = parseDifficulty(searchParams.get("difficulty"));

  const effectiveGameId = routeGameId !== undefined && routeGameId !== "" ? routeGameId : undefined;
  const mode: GameMode = effectiveGameId ? "friend" : (modeParam ?? "solo");

  // ── Store ─────────────────────────────────────────────────────────────────

  const store = useDotsStore();
  const state = store;
  const {
    hoverEdge: storeHoverEdge,
    claimEdge: storeClaimEdge,
    undoMove,
    requestHint,
    resetGame,
  } = store;

  // ── Online hook ────────────────────────────────────────────────────────────

  const {
    commitMoveToFirebase,
    resignGame: dotsResignGame,
    myPlayerId,
  } = useDotsOnline({ gameId: effectiveGameId, mode });

  const isNetworked = mode === "online" || mode === "friend";
  const isNetworkedWithGame = isNetworked && effectiveGameId !== undefined;

  const firebaseConnected = useFirebaseConnected(isNetworkedWithGame);
  const networkPlayBlocked = isNetworked && firebaseConnected === false;

  // ── Post-move callback for online writes ───────────────────────────────────

  // const onlineWriteBusy = useRef(false);

  useEffect(() => {
    if (!isNetworkedWithGame) {
      return;
    }

    // const postMoveCallback = (newState: typeof state) => {
    //   if (onlineWriteBusy.current) return;
    //   onlineWriteBusy.current = true;
    //   void commitMoveToFirebase(newState as any).finally(() => {
    //     onlineWriteBusy.current = false;
    //   });
    // };

    // For now, we'll hook this manually in claimEdge if networked
    // In a full implementation, we'd use the store's post-move callback
    return undefined;
  }, [isNetworkedWithGame, commitMoveToFirebase]);

  // ── Settings ───────────────────────────────────────────────────────────────

  const [settingsOpen, setSettingsOpen] = useState(false);
  const allowUndoSetting = useDotsSettings((s) => s.allowUndo);
  const hintsEnabledSetting = useDotsSettings((s) => s.hintsEnabled);
  const defaultBoardSize = useDotsSettings((s) => s.defaultSize);

  useLayoutEffect(() => {
    const snapshot = useDotsStore.getState();
    if (snapshot.history.length > 0 || snapshot.status !== "idle") return;
    const matchesDefault =
      snapshot.size.rows === defaultBoardSize.rows && snapshot.size.cols === defaultBoardSize.cols;
    if (matchesDefault) return;
    resetGame(defaultBoardSize);
  }, [defaultBoardSize.cols, defaultBoardSize.rows, resetGame]);

  // ── AI detection (solo only) ───────────────────────────────────────────────

  const isGameOver = state.status === "finished";
  const isAiTurn = mode === "solo" && state.currentPlayer === 2 && !isGameOver;

  // ── AI hook ────────────────────────────────────────────────────────────────

  const { isThinking } = useDotsAI({
    state,
    difficulty,
    isAiTurn,
    claimEdge: storeClaimEdge,
  });

  // ── Hint system ────────────────────────────────────────────────────────────

  const hintEnabled = mode === "solo" && hintsEnabledSetting;
  const isHintPlayerTurn = !isAiTurn && !isGameOver && mode !== "online" && mode !== "friend";

  const handleManualHint = useCallback(() => {
    if (state.hintTokens <= 0) return;
    requestHint();
  }, [state.hintTokens, requestHint]);

  const { secondsUntilAutoHint, onUserActivity } = useDotsHintSystem({
    isPlayerTurn: isHintPlayerTurn,
  });

  // ── Undo ───────────────────────────────────────────────────────────────────

  const canUndo = allowUndoSetting && mode !== "online" && mode !== "friend";
  const handleUndo = useCallback(() => {
    if (isAiTurn) return;
    if (!canUndo) return;
    undoMove();
  }, [isAiTurn, undoMove, canUndo]);

  // ── Play again ─────────────────────────────────────────────────────────────

  const handlePlayAgain = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const handleHome = useCallback(() => {
    void navigate("/play/dots-and-boxes");
  }, [navigate]);

  // ── Resign ─────────────────────────────────────────────────────────────────

  const handleResign = useCallback(() => {
    if (!isNetworkedWithGame) return;
    void dotsResignGame();
  }, [isNetworkedWithGame, dotsResignGame]);

  // ── Board interaction ──────────────────────────────────────────────────────

  const isPlayerTurn =
    !isAiTurn && !isGameOver && state.currentPlayer === (myPlayerId ?? 1) && !networkPlayBlocked;
  const boardLocked =
    isGameOver || isAiTurn || (isNetworked && !isPlayerTurn) || networkPlayBlocked;

  // ── Show board size picker before first move in solo/local ─────────────────

  const hasStarted = state.status !== "idle";

  // ── Win overlay state ──────────────────────────────────────────────────────

  const deriveOverlayState = () => {
    if (state.status !== "finished") {
      return { open: false, headline: "", palette: "cyan" as const, celebrate: false };
    }

    if (state.winner === "draw") {
      return { open: true, headline: "Draw", palette: "purple" as const, celebrate: false };
    }

    if (mode === "local") {
      const winnerName = state.winner === 1 ? "Player 1" : "Player 2";
      return {
        open: true,
        headline: `${winnerName} Wins!`,
        palette: "cyan" as const,
        celebrate: true,
      };
    }

    // Solo mode
    const playerWins = state.winner === 1;
    return {
      open: true,
      headline: playerWins ? "You Win!" : "AI Wins",
      palette: (playerWins ? "cyan" : "rose") as "cyan" | "rose",
      celebrate: playerWins,
    };
  };

  const overlay = deriveOverlayState();

  // ── Keyboard shortcut: U = undo ────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "u" || e.key === "U") handleUndo();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo]);

  // ── Render ─────────────────────────────────────────────────────────────────

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
          onClick={() => navigate("/play/dots-and-boxes")}
          className="text-sm text-(--na-text-muted) hover:text-(--na-text) transition-colors"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          ← Dots & Boxes
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
            {mode === "solo"
              ? `Solo · ${difficulty}`
              : mode === "local"
                ? "Local"
                : mode === "friend"
                  ? "Friend"
                  : "Online"}
          </span>
          {canUndo ? (
            <button
              type="button"
              onClick={handleUndo}
              disabled={state.history.length === 0 || isAiTurn}
              className="ml-2 rounded border border-(--na-border) px-2 py-1 text-xs text-(--na-text-muted) transition-all hover:border-(--na-cyan) hover:text-(--na-cyan) disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--na-font-display)" }}
              aria-label="Undo last move"
            >
              Undo
            </button>
          ) : null}
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
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-10 lg:overflow-hidden lg:px-6 lg:py-6">
        {/* Board column */}
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-start gap-4 lg:justify-center lg:py-8"
          onClick={onUserActivity}
        >
          {/* AI thinking indicator */}
          {mode === "solo" ? (
            <div
              className={`text-xs tracking-widest uppercase text-(--na-rose) ${isThinking ? "visible" : "invisible"}`}
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              AI thinking…
            </div>
          ) : null}

          {/* Board size picker (pre-game) */}
          <BoardSizePicker mode={mode} hasStarted={hasStarted} />

          {/* Dots board */}
          <DotsBoard
            state={state}
            onClaimEdge={storeClaimEdge}
            onHoverEdge={storeHoverEdge}
            isDisabled={boardLocked}
          />
        </div>

        {/* Sidebar */}
        <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0 lg:justify-start">
          <DotsHUD
            currentPlayer={state.currentPlayer}
            hintTokens={state.hintTokens}
            historyLength={state.history.length}
            status={state.status}
            hintsEnabled={hintEnabled}
            secondsUntilAutoHint={secondsUntilAutoHint}
            onRequestHint={handleManualHint}
            isThinking={isThinking}
            showUndo={canUndo}
            onUndo={handleUndo}
            p1Label={mode === "local" ? "Player 1" : mode === "solo" ? "You" : "Player 1"}
            p2Label={mode === "local" ? "Player 2" : mode === "solo" ? "AI" : "Player 2"}
          />

          <DotsScoreBoard
            scores={state.scores}
            currentPlayer={state.currentPlayer}
            lastClaimedBoxes={state.lastClaimedBoxes}
            p1Label={mode === "local" ? "Player 1" : mode === "solo" ? "You" : "Player 1"}
            p2Label={mode === "local" ? "Player 2" : mode === "solo" ? "AI" : "Player 2"}
          />
        </div>
      </div>

      {/* Win overlay */}
      <GameEndOverlay presentation={overlay} onPlayAgain={handlePlayAgain} onHome={handleHome} />

      {/* Settings panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DotsSettingsSection />
      </SettingsPanel>
    </div>
  );
}
