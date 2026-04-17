import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { GameBoard } from "@/components/GameBoard";
import { PlayerHUD } from "@/components/PlayerHUD";
import { WinOverlay, type WinOverlayPalette } from "@/components/WinOverlay";
import { useGameStore } from "@/hooks/useGameStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { pickAiMove } from "@/lib/ai/pick-move";
import type { Difficulty, GameMode } from "@/types/game";

/** Prevents duplicate score bumps (e.g. React Strict Mode) for the same finished board. */
let soloOutcomeLock: string | null = null;

function resetSoloOutcomeLock(): void {
  soloOutcomeLock = null;
}

function trySoloOutcomeLock(key: string): boolean {
  if (soloOutcomeLock === key) return false;
  soloOutcomeLock = key;
  return true;
}

function parseMode(value: string | null): GameMode | null {
  if (value === "solo" || value === "local" || value === "online" || value === "friend")
    return value;
  return null;
}

function parseDifficulty(value: string | null): Difficulty | null {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  return null;
}

function useEndgamePresentation(): {
  open: boolean;
  headline: string;
  palette: WinOverlayPalette;
} {
  const mode = useGameStore((s) => s.mode);
  const status = useGameStore((s) => s.status);
  const winner = useGameStore((s) => s.winner);
  const nickname = usePlayerStore((s) => s.nickname);
  const localGuestNickname = usePlayerStore((s) => s.localGuestNickname);
  const role = usePlayerStore((s) => s.role);

  return useMemo(() => {
    const open = status === "win" || status === "draw";
    if (!open) {
      return { open: false, headline: "", palette: "purple" as const };
    }

    if (status === "draw") {
      return { open: true, headline: "DRAW", palette: "purple" as const };
    }

    if (mode === "local") {
      const nickX = nickname.trim() === "" ? "Player X" : nickname;
      const nickO = localGuestNickname.trim() === "" ? "Player O" : localGuestNickname;
      if (winner === "X")
        return { open: true, headline: `${nickX} wins!`, palette: "cyan" as const };
      return { open: true, headline: `${nickO} wins!`, palette: "rose" as const };
    }

    if (mode === "solo") {
      const human = role ?? "X";
      if (winner === human) {
        return {
          open: true,
          headline: "YOU WIN",
          palette: (human === "X" ? "cyan" : "rose") as WinOverlayPalette,
        };
      }
      return {
        open: true,
        headline: "YOU LOSE",
        palette: (winner === "X" ? "cyan" : "rose") as WinOverlayPalette,
      };
    }

    if (winner === "X") return { open: true, headline: "X WINS", palette: "cyan" as const };
    return { open: true, headline: "O WINS", palette: "rose" as const };
  }, [status, winner, mode, nickname, localGuestNickname, role]);
}

export function GamePage() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const board = useGameStore((s) => s.board);
  const winLine = useGameStore((s) => s.winLine);
  const winner = useGameStore((s) => s.winner);
  const status = useGameStore((s) => s.status);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const makeMove = useGameStore((s) => s.makeMove);
  const resetGame = useGameStore((s) => s.resetGame);

  const score = usePlayerStore((s) => s.score);
  const applySoloOutcome = usePlayerStore((s) => s.applySoloOutcome);

  const endgame = useEndgamePresentation();

  useEffect(() => {
    resetSoloOutcomeLock();
    resetGame();
    const m = parseMode(searchParams.get("mode"));
    const d = parseDifficulty(searchParams.get("difficulty"));
    if (m !== null) useGameStore.getState().setMode(m);
    if (d !== null) useGameStore.getState().setDifficulty(d);
  }, [searchParams, resetGame]);

  useEffect(() => {
    if (status !== "win" && status !== "draw") return;

    if (mode !== "solo") return;

    const key = `${mode}-${status}-${winner ?? "none"}-${board.join("")}`;
    if (!trySoloOutcomeLock(key)) return;

    if (status === "draw") {
      applySoloOutcome("draw");
      return;
    }

    const human = usePlayerStore.getState().role ?? "X";
    if (winner === human) applySoloOutcome("win");
    else applySoloOutcome("loss");
  }, [status, winner, mode, board, applySoloOutcome]);

  const aiBusy = useRef(false);

  useEffect(() => {
    if (mode !== "solo") return;
    if (status === "win" || status === "draw") return;

    const store = useGameStore.getState();
    if (store.getIsMyTurn()) {
      aiBusy.current = false;
      return;
    }

    if (aiBusy.current) return;
    aiBusy.current = true;

    const delay = 300 + Math.random() * 300;
    const timer = window.setTimeout(() => {
      const s = useGameStore.getState();
      const cell = pickAiMove(s.board, s.difficulty, s.currentTurn);
      if (cell !== null) {
        s.makeMove(cell, { actor: "system" });
      }
      aiBusy.current = false;
    }, delay);

    return () => {
      window.clearTimeout(timer);
      aiBusy.current = false;
    };
  }, [board, currentTurn, mode, status, difficulty]);

  const handleCellClick = useCallback(
    (index: number) => {
      makeMove(index);
    },
    [makeMove],
  );

  const handlePlayAgain = useCallback(() => {
    resetSoloOutcomeLock();
    resetGame();
  }, [resetGame]);

  const handleOverlayHome = useCallback(() => {
    resetSoloOutcomeLock();
    resetGame();
    void navigate("/");
  }, [resetGame, navigate]);

  const handleAutoDismiss = useCallback(() => {
    resetSoloOutcomeLock();
    resetGame();
  }, [resetGame]);

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-lg flex-col p-4 sm:p-8">
      <h1 className="sr-only">Game</h1>
      {gameId ? (
        <p className="mb-2 text-sm text-[color:var(--na-text-muted)]">Online match: {gameId}</p>
      ) : null}
      <PlayerHUD />
      <GameBoard board={board} winLine={winLine} winner={winner} onCellClick={handleCellClick} />
      <WinOverlay
        open={endgame.open}
        headline={endgame.headline}
        palette={endgame.palette}
        scoreWins={score.wins}
        scoreLosses={score.losses}
        scoreDraws={score.draws}
        onPlayAgain={handlePlayAgain}
        onHome={handleOverlayHome}
        onAutoDismiss={handleAutoDismiss}
      />
    </main>
  );
}
