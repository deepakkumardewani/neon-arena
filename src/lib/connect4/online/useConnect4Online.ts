import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { connect4GameService } from "./connect4GameService";
import { docToState, buildCommitPayload } from "./connect4GameMappers";
import { useConnect4Store } from "@/lib/connect4/state/useConnect4Store";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { getMatchmakingQueueEntryId } from "@/lib/matchmaking/queueEntryId";
import type { GameDoc, GameDocPlayer } from "@/types/firebase";
import type { GameMode } from "@/types/game";
import type { PlayerId } from "@/lib/connect4/types";

const DISCONNECT_WIN_MS = 30_000;

function playerMatchesSeat(p: GameDocPlayer, auth: string, tabEntryId: string): boolean {
  if (auth === "" || p.uid !== auth) return false;
  if (p.queueEntryId === undefined) return true;
  return p.queueEntryId === tabEntryId;
}

function playerIdentity(p: GameDocPlayer): string {
  return p.queueEntryId ?? p.uid;
}

export interface UseConnect4OnlineOptions {
  readonly gameId: string | undefined;
  readonly mode: GameMode;
}

export function useConnect4Online({ gameId, mode }: UseConnect4OnlineOptions): {
  readonly commitMoveToFirebase: () => Promise<void>;
  readonly resignGame: () => Promise<void>;
  readonly acceptRematch: () => Promise<void>;
  readonly declineRematch: () => Promise<void>;
  readonly notifyLeaveGame: () => Promise<void>;
  readonly myPlayerId: PlayerId | null;
  readonly p1Name: string;
  readonly p2Name: string;
} {
  const navigate = useNavigate();
  const uid = usePlayerStore((s) => s.uid);
  const tabEntryId = uid !== "" ? getMatchmakingQueueEntryId(uid) : "";
  const applyRemoteState = useConnect4Store((s) => s.applyRemoteState);
  const storeState = useConnect4Store((s) => s.state);

  const [myPlayerId, setMyPlayerId] = useState<PlayerId | null>(null);
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");
  const latestDocRef = useRef<GameDoc | null>(null);

  useEffect(() => {
    if (gameId === undefined || gameId === "") return;
    if (mode !== "online" && mode !== "friend") return;

    const unsub = connect4GameService.subscribeConnect4Game(gameId, (doc: GameDoc) => {
      latestDocRef.current = doc;

      // Handle rematch navigation
      const next = doc.nextGameId;
      if (typeof next === "string" && next.length > 0) {
        void navigate(`/game/connect4/${next}?mode=${mode}`);
        return;
      }

      // Handle rematch declined
      if (doc.rematchDeclined === true) {
        void navigate("/play/connect4");
        return;
      }

      // Determine player ID from doc
      const isPlayer1 = playerMatchesSeat(doc.playerX, uid, tabEntryId);
      const isPlayer2 = doc.playerO !== null && playerMatchesSeat(doc.playerO, uid, tabEntryId);
      const playerId: PlayerId | null = isPlayer1 ? 1 : isPlayer2 ? 2 : null;

      if (playerId !== myPlayerId) {
        setMyPlayerId(playerId);
      }

      // Set HUD names
      setP1Name(doc.playerX.nickname);
      if (doc.playerO) {
        setP2Name(doc.playerO.nickname);
      }

      // Handle disconnect win
      if (
        doc.disconnectedBy !== null &&
        doc.disconnectedAt !== null &&
        uid !== "" &&
        uid !== doc.disconnectedBy &&
        doc.status === "active" &&
        Date.now() - doc.disconnectedAt >= DISCONNECT_WIN_MS
      ) {
        const remoteState = docToState(doc);
        applyRemoteState({
          state: {
            ...remoteState,
            status: "finished",
            winResult: remoteState.winResult ?? {
              winner: playerId ?? 1,
              cells: [],
            },
          },
        });
        return;
      }

      applyRemoteState({ state: docToState(doc) });
    });

    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, mode, navigate, tabEntryId, uid, applyRemoteState]);

  const commitMoveToFirebase = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;

    const doc = latestDocRef.current;
    if (!doc || doc.status !== "active" || doc.playerO === null) return;

    const isPlayer1 = playerMatchesSeat(doc.playerX, uid, tabEntryId);
    const isPlayer2 = playerMatchesSeat(doc.playerO, uid, tabEntryId);
    const playerId = isPlayer1 ? 1 : isPlayer2 ? 2 : null;
    if (playerId === null) return;

    // Check it's our turn
    const myIdentity = isPlayer1 ? playerIdentity(doc.playerX) : playerIdentity(doc.playerO);
    if (doc.currentTurn !== myIdentity) return;

    const nextTurnIdentity =
      doc.currentTurn === playerIdentity(doc.playerX)
        ? playerIdentity(doc.playerO)
        : playerIdentity(doc.playerX);

    const payload = buildCommitPayload(storeState, nextTurnIdentity);

    await connect4GameService.commitMove(gameId, payload);
  }, [gameId, storeState, tabEntryId, uid]);

  const resign = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;

    const doc = latestDocRef.current;
    if (!doc || doc.status !== "active" || doc.playerO === null) return;

    const isPlayer1 = playerMatchesSeat(doc.playerX, uid, tabEntryId);
    const isPlayer2 = playerMatchesSeat(doc.playerO, uid, tabEntryId);

    if (isPlayer1) {
      await connect4GameService.resignGame(gameId, playerIdentity(doc.playerX));
    } else if (isPlayer2) {
      await connect4GameService.resignGame(gameId, playerIdentity(doc.playerO));
    }
  }, [gameId, tabEntryId, uid]);

  const acceptRematch = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await connect4GameService.acceptRematch(
      gameId,
      uid,
      tabEntryId === "" ? undefined : tabEntryId,
    );
  }, [gameId, tabEntryId, uid]);

  const declineRematch = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await connect4GameService.declineRematch(gameId, uid);
  }, [gameId, uid]);

  const notifyLeaveGame = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await connect4GameService.setDisconnected(gameId, uid);
  }, [gameId, uid]);

  return {
    commitMoveToFirebase,
    resignGame: resign,
    acceptRematch,
    declineRematch,
    notifyLeaveGame,
    myPlayerId,
    p1Name,
    p2Name,
  };
}
