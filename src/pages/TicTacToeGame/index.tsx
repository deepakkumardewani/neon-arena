import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ConnectionLostBanner } from "@/components/ConnectionLostBanner";
import { GameBoard } from "@/components/GameBoard";
import { GamePageShell } from "@/components/GamePageShell";
import { PlayerHUD } from "@/components/PlayerHUD";
import { useConfirm } from "@/components/ui/confirm";
import { WinOverlay, type WinOverlayPalette } from "@/components/WinOverlay";
import { FriendLobby } from "@/pages/FriendLobby/FriendLobby";
import { useFirebaseConnected } from "@/hooks/useFirebaseConnected";
import { useGameStore } from "@/hooks/useGameStore";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useScore } from "@/hooks/useScore";
import { pickAiMove } from "@/lib/ai/pick-move";
import { audioManager } from "@/lib/audio/audioManager";
import { soloAiMoveDelayMs } from "@/lib/game/solo-ai-timing";
import { hapticManager } from "@/lib/haptics/hapticManager";
import { gameService, scoreService } from "@/lib/services";
import type { Difficulty, GameMode } from "@/types/game";

function createOutcomeLock() {
  let current: string | null = null;
  return {
    reset: (): void => {
      current = null;
    },
    try: (key: string): boolean => {
      if (current === key) return false;
      current = key;
      return true;
    },
  };
}

/** Prevents duplicate score bumps (e.g. React Strict Mode) for the same finished board. */
const soloOutcomeLock = createOutcomeLock();
/** Reused for online / friend score bumps to Firestore. */
const networkOutcomeLock = createOutcomeLock();

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
  /** Confetti burst — off for defeats and draws so only real wins celebrate. */
  celebrate: boolean;
} {
  const mode = useGameStore((s) => s.mode);
  const status = useGameStore((s) => s.status);
  const winner = useGameStore((s) => s.winner);
  const nickname = usePlayerStore((s) => s.nickname);
  const localGuestNickname = usePlayerStore((s) => s.localGuestNickname);
  const role = usePlayerStore((s) => s.role);

  return useMemo(() => {
    const open = status === "win" || status === "draw";
    if (!open) return { open: false, headline: "", palette: "purple" as const, celebrate: false };

    if (status === "draw") {
      return { open: true, headline: "DRAW", palette: "purple" as const, celebrate: false };
    }

    if (mode === "local") {
      const nickX = nickname.trim() === "" ? "Player X" : nickname;
      const nickO = localGuestNickname.trim() === "" ? "Player O" : localGuestNickname;
      const headline = winner === "X" ? `${nickX} wins!` : `${nickO} wins!`;
      const palette = (winner === "X" ? "cyan" : "rose") as WinOverlayPalette;
      return { open: true, headline, palette, celebrate: true };
    }

    // solo, online, and friend all use the same you-win / you-lose logic
    if (mode === "solo" || mode === "online" || mode === "friend") {
      const human = role ?? "X";
      const isWin = winner === human;
      return {
        open: true,
        headline: isWin ? "YOU WIN" : "YOU LOSE",
        palette: (winner === "X" ? "cyan" : "rose") as WinOverlayPalette,
        celebrate: isWin,
      };
    }

    const headline = winner === "X" ? "X WINS" : "O WINS";
    const palette = (winner === "X" ? "cyan" : "rose") as WinOverlayPalette;
    return { open: true, headline, palette, celebrate: true };
  }, [status, winner, mode, nickname, localGuestNickname, role]);
}

export function TicTacToeGamePage() {
  const { gameId: routeGameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const friendFirestoreSynced = useGameStore((s) => s.friendFirestoreSynced);
  const friendHostWaiting = useGameStore((s) => s.friendHostWaiting);
  const friendJoinRequired = useGameStore((s) => s.friendJoinRequired);

  const role = usePlayerStore((s) => s.role);
  const applySoloOutcome = usePlayerStore((s) => s.applySoloOutcome);
  const setScore = usePlayerStore((s) => s.setScore);
  const uid = usePlayerStore((s) => s.uid);

  useScore(uid === "" ? undefined : uid);

  const { alert: alertDialog, confirm: confirmDialog } = useConfirm();

  const onRematchDeclined = useCallback(() => {
    return alertDialog({ message: "Opponent declined" });
  }, [alertDialog]);

  const { submitOnlineMove, acceptNetworkRematch, declineNetworkRematch, notifyLeaveGame } =
    useOnlineGame({ gameId: effectiveGameId, mode, onRematchDeclined });

  const isNetworked = mode === "online" || mode === "friend";
  const isNetworkedWithGame =
    isNetworked && effectiveGameId !== undefined && effectiveGameId !== "";
  const firebaseConnected = useFirebaseConnected(isNetworkedWithGame);
  const networkPlayBlocked = isNetworked && firebaseConnected === false;

  /** Host waiting for guest: Firestore confirms, or optimistic while role is X (persisted) before first snapshot. */
  const isFriendHostLobby =
    mode === "friend" &&
    status === "idle" &&
    (friendHostWaiting ||
      (role === "X" && (onlineHudNames === null || onlineHudNames.o === "Waiting…")));

  /** Hide grid until we know friend-room state, or while host is sharing, or guest must join elsewhere. */
  const hideFriendBoard =
    mode === "friend" &&
    status === "idle" &&
    (!friendFirestoreSynced || isFriendHostLobby || friendJoinRequired);

  function getFriendPrematchHeadline(): string | null {
    if (mode !== "friend" || status !== "idle") return null;
    if (isFriendHostLobby)
      return "Invite your friend with the link below. The board opens once they join.";
    if (!friendFirestoreSynced) return "Connecting to room…";
    if (friendJoinRequired) return "Opening join screen…";
    return null;
  }
  const friendPrematchHeadline = getFriendPrematchHeadline();

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
    soloOutcomeLock.reset();
    networkOutcomeLock.reset();
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
    const lock = mode === "solo" ? soloOutcomeLock : networkOutcomeLock;
    if (!lock.try(key)) return;

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

  const onlineMoveBusy = useRef(false);
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

    const delay = soloAiMoveDelayMs();
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
      if (hideFriendBoard) return;
      if (isNetworkedWithGame) {
        if (networkPlayBlocked) return;
        if (onlineMoveBusy.current) return;
        onlineMoveBusy.current = true;
        void submitOnlineMove(index).finally(() => {
          onlineMoveBusy.current = false;
        });
        return;
      }
      makeMove(index);
    },
    [hideFriendBoard, isNetworkedWithGame, makeMove, networkPlayBlocked, submitOnlineMove],
  );

  const withUiFeedback = useCallback((fn: () => void) => {
    return (): void => {
      audioManager.play("click");
      hapticManager.tap();
      fn();
    };
  }, []);

  const handlePlayAgain = useCallback(() => {
    if (isNetworkedWithGame) {
      networkOutcomeLock.reset();
      void acceptNetworkRematch();
      return;
    }
    soloOutcomeLock.reset();
    resetGame();
  }, [acceptNetworkRematch, isNetworkedWithGame, resetGame]);

  const handleOverlayHome = useCallback(() => {
    if (isNetworkedWithGame && (status === "win" || status === "draw")) {
      void declineNetworkRematch();
    }
    soloOutcomeLock.reset();
    networkOutcomeLock.reset();
    resetGame();
    void navigate("/");
  }, [declineNetworkRematch, isNetworkedWithGame, navigate, resetGame, status]);

  const onLeaveLiveGame = isNetworked && status === "playing" ? notifyLeaveGame : undefined;

  const handleFriendLobbyHome = useCallback((): void => {
    audioManager.play("click");
    hapticManager.tap();
    void (async () => {
      if (mode === "online" || mode === "friend") {
        const ok = await confirmDialog({ message: "Leave the live game and return home?" });
        if (!ok) return;
      }
      if (onLeaveLiveGame !== undefined) {
        await onLeaveLiveGame();
      }
      void navigate("/");
    })();
  }, [confirmDialog, mode, navigate, onLeaveLiveGame]);

  return (
    <GamePageShell>
      {({ onOpenSettings }) => (
        <>
          {networkPlayBlocked ? <ConnectionLostBanner /> : null}
          {isFriendHostLobby && effectiveGameId !== undefined ? (
            <section className="mb-6 rounded-tl-xl rounded-br-xl border border-(--na-purple) bg-(--na-surface) p-5 shadow-(--na-glow-grid)">
              <FriendLobby gameId={effectiveGameId} onHome={handleFriendLobbyHome} />
            </section>
          ) : (
            <PlayerHUD
              prematchHeadline={friendPrematchHeadline}
              onOpenSettings={onOpenSettings}
              onLeaveLiveGame={onLeaveLiveGame}
            />
          )}
          {hideFriendBoard ? null : (
            <GameBoard
              board={board}
              winLine={winLine}
              winner={winner}
              onCellClick={handleCellClick}
              interactionLocked={networkPlayBlocked}
            />
          )}
          <WinOverlay
            open={endgame.open}
            headline={endgame.headline}
            palette={endgame.palette}
            celebrate={endgame.celebrate}
            onPlayAgain={withUiFeedback(handlePlayAgain)}
            onHome={withUiFeedback(handleOverlayHome)}
          />
        </>
      )}
    </GamePageShell>
  );
}
