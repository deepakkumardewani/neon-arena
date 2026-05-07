import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ChessBoard } from "@/components/chess/ChessBoard";
import { ChessHUD } from "@/components/chess/ChessHUD";
import { CapturedPiecesBar } from "@/components/chess/CapturedPiecesBar";
import { MoveHistoryPanel } from "@/components/chess/MoveHistoryPanel";
import { PromotionModal } from "@/components/chess/PromotionModal";
import { ConnectionLostBanner } from "@/components/ConnectionLostBanner";
import { SettingsPanel } from "@/components/SettingsPanel";
import { WinOverlay } from "@/components/WinOverlay";

import { useChessStore } from "@/lib/chess/state/useChessStore";
import { useChessSettings } from "@/lib/chess/state/useGameSettings";
import { useStockfish } from "@/lib/chess/engine/useStockfish";
import { useHintSystem } from "@/lib/chess/hints/useHintSystem";
import { useChessOnline } from "@/lib/chess/online/useChessOnline";
import { useFirebaseConnected } from "@/hooks/useFirebaseConnected";
import { HINT_DISPLAY_MS } from "@/lib/chess/hints/hintConfig";
import type { Difficulty } from "@/lib/chess/engine/difficultyMap";
import type { GameMode } from "@/types/game";
import type { PieceType, SquareIndex, PieceColor } from "@/lib/chess/types";

// ── UCI helpers ───────────────────────────────────────────────────────────────

function algebraicToIndex(sq: string): SquareIndex {
  return (parseInt(sq[1]) - 1) * 8 + (sq.charCodeAt(0) - 97);
}

const UCI_PROMO_MAP: Record<string, PieceType> = {
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
};

function parseUciMove(uciMove: string): {
  from: SquareIndex;
  to: SquareIndex;
  promotion?: PieceType;
} {
  return {
    from: algebraicToIndex(uciMove.slice(0, 2)),
    to: algebraicToIndex(uciMove.slice(2, 4)),
    promotion: uciMove[4] ? UCI_PROMO_MAP[uciMove[4]] : undefined,
  };
}

function parseMode(value: string | null): GameMode | null {
  if (value === "solo" || value === "local" || value === "online" || value === "friend")
    return value;
  return null;
}

function parseDifficulty(value: string | null): Difficulty {
  const d = (value ?? "medium") as Difficulty;
  return ["easy", "medium", "hard"].includes(d) ? d : "medium";
}

// ── Win overlay helpers ───────────────────────────────────────────────────────

function resignedHeadline(winner: PieceColor, playerColor: PieceColor, mode: GameMode): string {
  if (mode === "local") return `Resigned — ${winner === "white" ? "White" : "Black"} wins`;
  return winner === playerColor ? "Opponent Resigned — You Win!" : "You Resigned";
}

function deriveOverlayState(
  status: string,
  activeColor: string,
  playerColor: PieceColor,
  mode: GameMode,
) {
  if (status === "resigned") {
    const winner = activeColor === "white" ? "black" : "white";
    const playerWon = mode === "local" || winner === playerColor;
    return {
      open: true,
      headline: resignedHeadline(winner, playerColor, mode),
      palette: (winner === playerColor || mode === "local" ? "cyan" : "rose") as "cyan" | "rose",
      celebrate: playerWon && mode !== "local",
    };
  }
  if (status === "checkmate") {
    const winner = activeColor === "white" ? "black" : "white";
    if (mode === "local") {
      return {
        open: true,
        headline: `Checkmate — ${winner === "white" ? "White" : "Black"} wins!`,
        palette: "cyan" as const,
        celebrate: true,
      };
    }
    const isWin = winner === playerColor;
    return {
      open: true,
      headline: isWin ? "Checkmate — You Win!" : "Checkmate — You Lose",
      palette: (isWin ? "cyan" : "rose") as "cyan" | "rose",
      celebrate: isWin,
    };
  }
  if (status === "stalemate") {
    return {
      open: true,
      headline: "Stalemate — Draw",
      palette: "purple" as const,
      celebrate: false,
    };
  }
  if (status === "draw") {
    return { open: true, headline: "Draw", palette: "purple" as const, celebrate: false };
  }
  if (status === "abandoned") {
    return { open: true, headline: "Game Abandoned", palette: "rose" as const, celebrate: false };
  }
  return { open: false, headline: "", palette: "cyan" as const, celebrate: false };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChessGamePage() {
  const navigate = useNavigate();
  const { gameId: routeGameId } = useParams();
  const [searchParams] = useSearchParams();

  const modeParam = parseMode(searchParams.get("mode"));
  const difficulty = parseDifficulty(searchParams.get("difficulty"));

  // Determine effective gameId and mode
  const effectiveGameId = routeGameId !== undefined && routeGameId !== "" ? routeGameId : undefined;
  const mode: GameMode = effectiveGameId ? "friend" : (modeParam ?? "solo");

  // ── Store ─────────────────────────────────────────────────────────────────

  const store = useChessStore();
  const { state, executeMove, undoMove, resetGame, applyHint, clearHint, setPostMoveCallback } =
    store;
  const { status, activeColor, hintTokens, fen } = state;

  const isNetworked = mode === "online" || mode === "friend";
  const isNetworkedWithGame = isNetworked && effectiveGameId !== undefined;

  // ── Settings ───────────────────────────────────────────────────────────────

  const [settingsOpen, setSettingsOpen] = useState(false);
  const showMoveHistory = useChessSettings((s) => s.showMoveHistory);
  const showCapturedPieces = useChessSettings((s) => s.showCapturedPieces);
  const allowUndoSetting = useChessSettings((s) => s.allowUndo);
  const hintsEnabledSetting = useChessSettings((s) => s.hintsEnabled);
  const autoHintDelayMs = useChessSettings((s) => s.autoHintDelayMs);

  // ── Online hook ────────────────────────────────────────────────────────────

  const {
    commitMoveToFirebase,
    resignGame,
    acceptRematch,
    declineRematch,
    notifyLeaveGame,
    myColor,
    whiteName,
    blackName,
  } = useChessOnline({ gameId: effectiveGameId, mode });

  const firebaseConnected = useFirebaseConnected(isNetworkedWithGame);
  const networkPlayBlocked = isNetworked && firebaseConnected === false;

  // ── Post-move callback for online writes ───────────────────────────────────

  const onlineWriteBusy = useRef(false);

  useEffect(() => {
    if (!isNetworkedWithGame) {
      setPostMoveCallback(null);
      return;
    }
    setPostMoveCallback((newState) => {
      if (onlineWriteBusy.current) return;
      onlineWriteBusy.current = true;
      const sanHistory = newState.history.map((m) => m.san);
      void commitMoveToFirebase(
        newState.fen,
        sanHistory,
        newState.capturedByWhite as string[],
        newState.capturedByBlack as string[],
      ).finally(() => {
        onlineWriteBusy.current = false;
      });
    });
    return () => {
      setPostMoveCallback(null);
    };
  }, [isNetworkedWithGame, commitMoveToFirebase, setPostMoveCallback]);

  // ── Player color & game-over detection ─────────────────────────────────────

  const playerColor: PieceColor =
    mode === "solo"
      ? "white"
      : mode === "local"
        ? activeColor // In local, whoever's turn it is (both are human)
        : (myColor ?? "white");

  const isGameOver =
    status === "checkmate" ||
    status === "stalemate" ||
    status === "draw" ||
    status === "resigned" ||
    status === "abandoned";

  // ── AI detection (solo only) ───────────────────────────────────────────────

  const isAiTurn = mode === "solo" && activeColor === "black" && !isGameOver;

  // ── Stockfish hook ──────────────────────────────────────────────────────────

  const handleAiMove = useCallback(
    (uciMove: string) => {
      const { from, to, promotion } = parseUciMove(uciMove);
      executeMove(from, to, promotion);
    },
    [executeMove],
  );

  const handleHintMove = useCallback(
    (uciMove: string) => {
      applyHint(uciMove);
      setTimeout(() => {
        clearHint();
      }, HINT_DISPLAY_MS);
    },
    [applyHint, clearHint],
  );

  const { isThinking, requestHint, resetEngine } = useStockfish({
    fen,
    difficulty,
    enabled: isAiTurn,
    onMove: handleAiMove,
    onHintMove: handleHintMove,
  });

  // ── Hint system ────────────────────────────────────────────────────────────

  const hintEnabled = mode === "solo" && hintsEnabledSetting;
  const isPlayerTurn =
    !isAiTurn && !isGameOver && state.promotionPending === null && !networkPlayBlocked;

  const handleManualHint = useCallback(() => {
    if (hintTokens <= 0 || isAiTurn) return;
    requestHint(fen);
  }, [hintTokens, isAiTurn, requestHint, fen]);

  const { secondsUntilAutoHint, onUserActivity } = useHintSystem({
    enabled: hintEnabled && hintTokens > 0,
    autoDelayMs: autoHintDelayMs,
    tokens: hintTokens,
    isPlayerTurn,
    onRequestHint: handleManualHint,
  });

  // ── Undo ───────────────────────────────────────────────────────────────────

  const canUndo = allowUndoSetting && mode !== "online" && mode !== "friend";
  const handleUndo = useCallback(() => {
    if (isAiTurn) return;
    if (!canUndo) return;
    undoMove(mode === "solo" ? "solo" : "local");
  }, [isAiTurn, undoMove, mode, canUndo]);

  // ── Play again ─────────────────────────────────────────────────────────────

  const handlePlayAgain = useCallback(() => {
    if (isNetworkedWithGame) {
      void acceptRematch();
      return;
    }
    resetGame();
    resetEngine();
  }, [acceptRematch, isNetworkedWithGame, resetGame, resetEngine]);

  const handleHome = useCallback(() => {
    if (
      isNetworkedWithGame &&
      (status === "checkmate" || status === "draw" || status === "resigned")
    ) {
      void declineRematch();
    }
    void navigate("/play/chess");
  }, [declineRematch, isNetworkedWithGame, navigate, status]);

  // ── Resign ─────────────────────────────────────────────────────────────────

  const handleResign = useCallback(() => {
    if (!isNetworkedWithGame) return;
    void resignGame();
  }, [isNetworkedWithGame, resignGame]);

  // ── Win overlay ────────────────────────────────────────────────────────────

  const overlay = deriveOverlayState(status, activeColor, playerColor, mode);

  // ── Keyboard shortcut: U = undo ────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "u" || e.key === "U") handleUndo();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo]);

  // ── Board display ──────────────────────────────────────────────────────────

  const boardLocked =
    isGameOver || isAiTurn || (isNetworked && !isNetworkedWithGame) || networkPlayBlocked;

  // In online/friend mode, board flips for black player
  const boardFlipped = isNetworked ? playerColor === "black" : false;

  // ── HUD labels ─────────────────────────────────────────────────────────────

  const hudWhiteLabel = mode === "solo" ? "You" : mode === "local" ? "White" : whiteName;
  const hudBlackLabel = mode === "solo" ? "AI" : mode === "local" ? "Black" : blackName;

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
          onClick={() => {
            if (isNetworkedWithGame) {
              void notifyLeaveGame();
            }
            void navigate("/play/chess");
          }}
          className="text-sm text-(--na-text-muted) hover:text-(--na-text) transition-colors"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          ← Chess
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

      {/* Main layout: board + sidebar */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:items-start lg:justify-center lg:overflow-hidden">
        {/* Board column */}
        <div
          className="flex flex-col items-center gap-3 lg:flex-1 lg:min-w-0"
          onClick={onUserActivity}
        >
          {/* Black's captured pieces (what white captured) */}
          <CapturedPiecesBar show={showCapturedPieces} />

          {/* AI thinking indicator — always reserve space to avoid layout shift */}
          {mode === "solo" ? (
            <div
              className={`text-xs tracking-widest uppercase text-(--na-rose) ${isThinking ? "visible" : "invisible"}`}
              style={{ fontFamily: "var(--na-font-display)" }}
            >
              AI thinking…
            </div>
          ) : null}

          <ChessBoard flipped={boardFlipped} locked={boardLocked} />

          {/* White's captured pieces (what black captured) */}
          <CapturedPiecesBar show={showCapturedPieces} />
        </div>

        {/* Sidebar */}
        <div className="flex w-full flex-col gap-3 lg:w-64">
          <ChessHUD
            whiteLabel={hudWhiteLabel}
            blackLabel={hudBlackLabel}
            hintsEnabled={hintEnabled}
            secondsUntilAutoHint={secondsUntilAutoHint}
            onRequestHint={handleManualHint}
            isThinking={isThinking || false}
          />

          <div className="min-h-0 flex-1 lg:max-h-[calc(100vh-12rem)]">
            <MoveHistoryPanel show={showMoveHistory} />
          </div>
        </div>
      </div>

      {/* Promotion modal — blocks game until piece chosen */}
      <PromotionModal />

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
        <ChessSettingsSection />
      </SettingsPanel>
    </div>
  );
}

// ── Chess-specific settings section ─────────────────────────────────────────

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span
        className="text-sm text-(--na-text-muted)"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        {label}
      </span>
      <input
        type="checkbox"
        className="h-5 w-5 accent-(--na-cyan)"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function ChessSettingsSection() {
  const showMoveHistory = useChessSettings((s) => s.showMoveHistory);
  const showCapturedPieces = useChessSettings((s) => s.showCapturedPieces);
  const allowUndo = useChessSettings((s) => s.allowUndo);
  const hintsEnabled = useChessSettings((s) => s.hintsEnabled);
  const autoHintDelayMs = useChessSettings((s) => s.autoHintDelayMs);
  const updateSetting = useChessSettings((s) => s.updateSetting);

  return (
    <div className="space-y-5">
      <p
        className="text-xs tracking-[0.22em] text-(--na-purple) uppercase"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        Chess
      </p>
      <SettingToggle
        label="Move history"
        checked={showMoveHistory}
        onChange={(v) => updateSetting("showMoveHistory", v)}
      />
      <SettingToggle
        label="Captured pieces"
        checked={showCapturedPieces}
        onChange={(v) => updateSetting("showCapturedPieces", v)}
      />
      <SettingToggle
        label="Allow undo"
        checked={allowUndo}
        onChange={(v) => updateSetting("allowUndo", v)}
      />
      <SettingToggle
        label="Hints"
        checked={hintsEnabled}
        onChange={(v) => updateSetting("hintsEnabled", v)}
      />
      <div>
        <label
          className="mb-2 block text-sm text-(--na-text-muted)"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          Auto-hint delay ({Math.round(autoHintDelayMs / 1000)}s)
        </label>
        <input
          type="range"
          min={10_000}
          max={120_000}
          step={10_000}
          value={autoHintDelayMs}
          className="w-full accent-(--na-purple)"
          onChange={(e) => updateSetting("autoHintDelayMs", Number(e.target.value))}
        />
      </div>
    </div>
  );
}
