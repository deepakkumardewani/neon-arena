import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { gameDocToRemoteSync } from "@/lib/online/gameDocMappers";
import { getMatchmakingQueueEntryId } from "@/lib/matchmaking/queueEntryId";
import { gameService } from "@/lib/services";
import { useGameStore } from "@/hooks/useGameStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import type { GameMode } from "@/types/game";

const DISCONNECT_WIN_MS = 30_000;

function playerMatchesSeat(
  p: { readonly uid: string; readonly queueEntryId?: string },
  auth: string,
  tabEntryId: string,
): boolean {
  if (auth === "" || p.uid !== auth) return false;
  if (p.queueEntryId === undefined) return true;
  return p.queueEntryId === tabEntryId;
}

export interface UseOnlineGameOptions {
  readonly gameId: string | undefined;
  readonly mode: GameMode;
}

export function useOnlineGame({ gameId, mode }: UseOnlineGameOptions): {
  readonly submitOnlineMove: (index: number) => Promise<void>;
  readonly acceptNetworkRematch: () => Promise<void>;
  readonly declineNetworkRematch: () => Promise<void>;
  readonly notifyLeaveGame: () => Promise<void>;
} {
  const navigate = useNavigate();
  const uid = usePlayerStore((s) => s.uid);
  const tabEntryId = useMemo(() => (uid === "" ? "" : getMatchmakingQueueEntryId(uid)), [uid]);
  const role = usePlayerStore((s) => s.role);
  const setRole = usePlayerStore((s) => s.setRole);
  const applyRemoteState = useGameStore((s) => s.applyRemoteState);
  const setOnlineHudNames = useGameStore((s) => s.setOnlineHudNames);

  useEffect(() => {
    if (gameId === undefined || gameId === "") return;
    if (mode !== "online" && mode !== "friend") return;

    const unsub = gameService.subscribeToGame(gameId, (doc) => {
      const next = doc.nextGameId;
      if (typeof next === "string" && next.length > 0) {
        void navigate(`/game/${next}?mode=${mode}`);
        return;
      }
      if (doc.rematchDeclined === true) {
        window.alert("Opponent declined");
        void navigate("/");
        return;
      }

      const myRole: "X" | "O" | null = playerMatchesSeat(doc.playerX, uid, tabEntryId)
        ? "X"
        : doc.playerO !== null && playerMatchesSeat(doc.playerO, uid, tabEntryId)
          ? "O"
          : null;
      if (myRole !== null) setRole(myRole);

      setOnlineHudNames({
        x: doc.playerX.nickname,
        o: doc.playerO?.nickname ?? "Waiting…",
      });

      if (
        doc.disconnectedBy !== null &&
        doc.disconnectedAt !== null &&
        uid !== "" &&
        uid !== doc.disconnectedBy &&
        doc.status === "active" &&
        Date.now() - doc.disconnectedAt >= DISCONNECT_WIN_MS
      ) {
        const mark: "X" | "O" = playerMatchesSeat(doc.playerX, uid, tabEntryId)
          ? "X"
          : doc.playerO !== null && playerMatchesSeat(doc.playerO, uid, tabEntryId)
            ? "O"
            : "X";
        applyRemoteState(gameDocToRemoteSync(doc, { winsAs: mark }));
        return;
      }

      applyRemoteState(gameDocToRemoteSync(doc));
    });

    return () => {
      unsub();
    };
  }, [applyRemoteState, gameId, mode, navigate, setOnlineHudNames, setRole, tabEntryId, uid]);

  const submitOnlineMove = useCallback(
    async (index: number) => {
      if (gameId === undefined || gameId === "") return;
      if (role === null) return;
      await gameService.makeMove(gameId, index, role, tabEntryId === "" ? undefined : tabEntryId);
    },
    [gameId, role, tabEntryId],
  );

  const acceptNetworkRematch = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await gameService.acceptRematch(gameId, uid, tabEntryId === "" ? undefined : tabEntryId);
  }, [gameId, tabEntryId, uid]);

  const declineNetworkRematch = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await gameService.declineRematch(gameId, uid);
  }, [gameId, uid]);

  const notifyLeaveGame = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await gameService.setDisconnected(gameId, uid);
  }, [gameId, uid]);

  return {
    submitOnlineMove,
    acceptNetworkRematch,
    declineNetworkRematch,
    notifyLeaveGame,
  };
}
