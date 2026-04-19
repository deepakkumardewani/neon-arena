import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { GameBoard } from "@/components/GameBoard";
import { PlayerHUD } from "@/components/PlayerHUD";
import { SettingsPanel } from "@/components/SettingsPanel";
import { WinOverlay, type WinOverlayPalette } from "@/components/WinOverlay";
import { FriendLobby } from "@/pages/FriendLobby/FriendLobby";
import { useGameStore } from "@/hooks/useGameStore";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useScore } from "@/hooks/useScore";
import { pickAiMove } from "@/lib/ai/pick-move";
import { audioManager } from "@/lib/audio/audioManager";
import { hapticManager } from "@/lib/haptics/hapticManager";
import { gameService, scoreService } from "@/lib/services";
import type { Difficulty, GameMode } from "@/types/game";

/** Prevents duplicate score bumps (e.g. React Strict Mode) for the same finished board. */
let soloOutcomeLock: string | null = null;

/** Reused for online / friend score bumps to Firestore. */
let networkOutcomeLock: string | null = null;

function resetSoloOutcomeLock(): void {
  soloOutcomeLock = null;
}

function trySoloOutcomeLock(key: string): boolean {
  if (soloOutcomeLock === key) return false;
  soloOutcomeLock = key;
  return true;
}

function resetNetworkOutcomeLock(): void {
  networkOutcomeLock = null;
}

function tryNetworkOutcomeLock(key: string): boolean {
  if (networkOutcomeLock === key) return false;
  networkOutcomeLock = key;
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

    if (mode === "online" || mode === "friend") {
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
  const { gameId: routeGameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchGameId = searchParams.get("gameId");
  const effectiveGameId =
    routeGameId !== undefined && routeGameId !== "" ? routeGameId : (searchGameId ?? undefined);

  const board = useGameStore((s) => s.board);
  const winLine = useGameStore((s) => s.winLine);
  const winner = useGameStore((s) => s.winner);
  const status = useGameStore((s) => s.status);
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const makeMove = useGameStore((s) => s.makeMove);
  const resetGame = useGameStore((s) => s.resetGame);
  const onlineHudNames = useGameStore((s) => s.onlineHudNames);

  const score = usePlayerStore((s) => s.score);
  const role = usePlayerStore((s) => s.role);
  const applySoloOutcome = usePlayerStore((s) => s.applySoloOutcome);
  const setScore = usePlayerStore((s) => s.setScore);
  const uid = usePlayerStore((s) => s.uid);

  useScore(uid === "" ? undefined : uid);

  const { submitOnlineMove, acceptNetworkRematch, declineNetworkRematch, notifyLeaveGame } =
    useOnlineGame({ gameId: effectiveGameId, mode });

  const isNetworked = mode === "online" || mode === "friend";
  const isFriendHostLobby =
    mode === "friend" &&
    status === "idle" &&
    role === "X" &&
    onlineHudNames !== null &&
    onlineHudNames.o === "Waiting…";

  const endgame = useEndgamePresentation();

  const filledPlaced = useRef(0);
  useEffect(() => {
    const n = board.filter(Boolean).length;
    if (n === 0) {
      filledPlaced.current = 0;
      return;
    }
    if (n > filledPlaced.current) {
      audioManager.play("place");
      hapticManager.place();
    }
    filledPlaced.current = n;
  }, [board]);

  const endgameSfxKey = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "win" && status !== "draw") {
      endgameSfxKey.current = null;
      return;
    }
    const key = `${status}-${winner ?? "none"}-${board.join("")}`;
    if (endgameSfxKey.current === key) return;
    endgameSfxKey.current = key;

    if (status === "draw") {
      audioManager.play("draw");
      return;
    }

    if (mode === "solo" || mode === "online" || mode === "friend") {
      const human = role ?? "X";
      if (winner === human) {
        audioManager.play("win");
        hapticManager.win();
      } else {
        audioManager.play("lose");
      }
      return;
    }

    audioManager.play("win");
    hapticManager.win();
  }, [status, winner, mode, board, role]);

  useEffect(() => {
    resetSoloOutcomeLock();
    resetNetworkOutcomeLock();
    resetGame();
    const m = parseMode(searchParams.get("mode"));
    const d = parseDifficulty(searchParams.get("difficulty"));
    if (m !== null) {
      useGameStore.getState().setMode(m);
    } else if (routeGameId !== undefined && routeGameId !== "") {
      useGameStore.getState().setMode("friend");
    }
    if (d !== null) useGameStore.getState().setDifficulty(d);
  }, [searchParams, routeGameId, resetGame]);

  const joinNavigated = useRef(false);
  useEffect(() => {
    const gid = effectiveGameId;
    if (joinNavigated.current) return;
    if (gid === undefined || gid === "") return;
    const urlMode = parseMode(searchParams.get("mode"));
    void gameService.getGame(gid).then((g) => {
      if (g === null) return;
      if (g.expiresAt > 0 && Date.now() > g.expiresAt) return;
      if (g.status !== "waiting") return;
      if (uid === "") return;
      if (g.playerX.uid === uid) return;
      if (g.playerO !== null && g.playerO.uid === uid) return;
      const treatAsFriend = urlMode === "friend" || routeGameId === gid;
      if (!treatAsFriend) return;
      joinNavigated.current = true;
      void navigate(`/play/tictactoe/nickname?mode=friend&joinGameId=${encodeURIComponent(gid)}`);
    });
  }, [effectiveGameId, navigate, routeGameId, searchParams, uid]);

  useEffect(() => {
    if (status !== "win" && status !== "draw") return;

    if (mode !== "solo" && mode !== "online" && mode !== "friend") return;

    const key = `${mode}-${status}-${winner ?? "none"}-${board.join("")}`;
    const lockFn = mode === "solo" ? trySoloOutcomeLock : tryNetworkOutcomeLock;
    if (!lockFn(key)) return;

    const store = usePlayerStore.getState();
    const playerUid = store.uid;
    const nick = store.nickname.trim() === "" ? "Player" : store.nickname.trim();
    const human = store.role ?? "X";

    const applyLocal = (): void => {
      if (status === "draw") {
        applySoloOutcome("draw");
        return;
      }
      if (winner === human) applySoloOutcome("win");
      else applySoloOutcome("loss");
    };

    if (playerUid === "") {
      applyLocal();
      return;
    }

    void (async () => {
      try {
        if (status === "draw") {
          await scoreService.incrementScore(playerUid, "draw", nick);
        } else if (winner !== null) {
          const result = winner === human ? "win" : "loss";
          await scoreService.incrementScore(playerUid, result, nick);
        }
        const next = await scoreService.getScore(playerUid);
        if (next !== null) setScore(next);
      } catch (e) {
        console.warn("[NeonArena] Remote score update failed:", e);
        applyLocal();
      }
    })();
  }, [status, winner, mode, board, applySoloOutcome, setScore]);

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
      if (isFriendHostLobby) return;
      if (isNetworked && effectiveGameId !== undefined && effectiveGameId !== "") {
        void submitOnlineMove(index);
        return;
      }
      makeMove(index);
    },
    [effectiveGameId, isFriendHostLobby, isNetworked, makeMove, submitOnlineMove],
  );

  const withUiFeedback = useCallback((fn: () => void) => {
    return (): void => {
      audioManager.play("click");
      hapticManager.tap();
      fn();
    };
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (isNetworked && effectiveGameId !== undefined && effectiveGameId !== "") {
      resetNetworkOutcomeLock();
      void acceptNetworkRematch();
      return;
    }
    resetSoloOutcomeLock();
    resetGame();
  }, [acceptNetworkRematch, effectiveGameId, isNetworked, resetGame]);

  const handleOverlayHome = useCallback(() => {
    if (
      isNetworked &&
      effectiveGameId !== undefined &&
      effectiveGameId !== "" &&
      (status === "win" || status === "draw")
    ) {
      void declineNetworkRematch();
    }
    resetSoloOutcomeLock();
    resetNetworkOutcomeLock();
    resetGame();
    void navigate("/");
  }, [declineNetworkRematch, effectiveGameId, isNetworked, navigate, resetGame, status]);

  const handleAutoDismiss = useCallback(() => {
    if (
      isNetworked &&
      effectiveGameId !== undefined &&
      effectiveGameId !== "" &&
      (status === "win" || status === "draw")
    ) {
      void declineNetworkRematch();
    }
    resetSoloOutcomeLock();
    resetNetworkOutcomeLock();
    resetGame();
    void navigate("/");
  }, [declineNetworkRematch, effectiveGameId, isNetworked, navigate, resetGame, status]);

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-lg flex-col p-4 sm:p-8">
      <h1 className="sr-only">Game</h1>
      {isFriendHostLobby && effectiveGameId !== undefined ? (
        <FriendLobby gameId={effectiveGameId} />
      ) : null}
      <PlayerHUD
        onOpenSettings={() => setSettingsOpen(true)}
        onLeaveLiveGame={isNetworked && status === "playing" ? notifyLeaveGame : undefined}
      />
      <GameBoard board={board} winLine={winLine} winner={winner} onCellClick={handleCellClick} />
      <WinOverlay
        open={endgame.open}
        headline={endgame.headline}
        palette={endgame.palette}
        scoreWins={score.wins}
        scoreLosses={score.losses}
        scoreDraws={score.draws}
        onPlayAgain={withUiFeedback(handlePlayAgain)}
        onHome={withUiFeedback(handleOverlayHome)}
        onAutoDismiss={handleAutoDismiss}
      />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
