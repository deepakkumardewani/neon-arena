import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { chessGameService } from "./chessGameService";
import { chessDocToGameState } from "./chessGameMappers";
import { useChessStore } from "@/lib/chess/state/useChessStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { getMatchmakingQueueEntryId } from "@/lib/matchmaking/queueEntryId";
import type { GameDoc, GameDocPlayer } from "@/types/firebase";
import type { GameMode } from "@/types/game";
import type { PieceColor } from "@/lib/chess/types";

const DISCONNECT_WIN_MS = 30_000;

function playerMatchesSeat(p: GameDocPlayer, auth: string, tabEntryId: string): boolean {
  if (auth === "" || p.uid !== auth) return false;
  if (p.queueEntryId === undefined) return true;
  return p.queueEntryId === tabEntryId;
}

function playerIdentity(p: GameDocPlayer): string {
  return p.queueEntryId ?? p.uid;
}

export interface UseChessOnlineOptions {
  readonly gameId: string | undefined;
  readonly mode: GameMode;
}

export function useChessOnline({ gameId, mode }: UseChessOnlineOptions): {
  readonly commitMoveToFirebase: (
    fen: string,
    history: string[],
    capturedByWhite: string[],
    capturedByBlack: string[],
  ) => Promise<void>;
  readonly resignGame: () => Promise<void>;
  readonly acceptRematch: () => Promise<void>;
  readonly declineRematch: () => Promise<void>;
  readonly notifyLeaveGame: () => Promise<void>;
  readonly myColor: PieceColor | null;
  readonly whiteName: string;
  readonly blackName: string;
} {
  const navigate = useNavigate();
  const uid = usePlayerStore((s) => s.uid);
  const tabEntryId = uid !== "" ? getMatchmakingQueueEntryId(uid) : "";
  const applyRemoteState = useChessStore((s) => s.applyRemoteState);

  const [myColor, setMyColor] = useState<PieceColor | null>(null);
  const [whiteName, setWhiteName] = useState("White");
  const [blackName, setBlackName] = useState("Black");
  const latestDocRef = useRef<GameDoc | null>(null);

  useEffect(() => {
    if (gameId === undefined || gameId === "") return;
    if (mode !== "online" && mode !== "friend") return;

    const unsub = chessGameService.subscribeToChessGame(gameId, (doc: GameDoc) => {
      latestDocRef.current = doc;

      // Handle rematch navigation
      const next = doc.nextGameId;
      if (typeof next === "string" && next.length > 0) {
        void navigate(`/game/chess/${next}?mode=${mode}`);
        return;
      }

      // Handle rematch declined
      if (doc.rematchDeclined === true) {
        void navigate("/play/chess");
        return;
      }

      // Determine player color from doc
      const isWhite = playerMatchesSeat(doc.playerX, uid, tabEntryId);
      const isBlack = doc.playerO !== null && playerMatchesSeat(doc.playerO, uid, tabEntryId);
      const color: PieceColor | null = isWhite ? "white" : isBlack ? "black" : null;

      if (color !== myColor) {
        setMyColor(color);
      }

      // Set HUD names
      setWhiteName(doc.playerX.nickname);
      if (doc.playerO) {
        setBlackName(doc.playerO.nickname);
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
        const winsAs = color === "white" ? "white" : "black";
        applyRemoteState(chessDocToGameState(doc, { winsAs }));
        return;
      }

      applyRemoteState(chessDocToGameState(doc));
    });

    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, mode, navigate, tabEntryId, uid, applyRemoteState]);

  const commitMoveToFirebase = useCallback(
    async (
      fen: string,
      history: string[],
      capturedByWhite: string[],
      capturedByBlack: string[],
    ) => {
      if (gameId === undefined || gameId === "") return;

      const doc = await chessGameService.getGame(gameId);
      if (!doc || doc.status !== "active" || doc.playerO === null) return;

      const isWhite = playerMatchesSeat(doc.playerX, uid, tabEntryId);
      const isBlack = playerMatchesSeat(doc.playerO, uid, tabEntryId);
      const color = isWhite ? "white" : isBlack ? "black" : null;
      if (color === null) return;

      const nextTurnIdentity =
        doc.currentTurn === playerIdentity(doc.playerX)
          ? playerIdentity(doc.playerO)
          : playerIdentity(doc.playerX);

      await chessGameService.commitMove(
        gameId,
        { fen, history, currentTurn: nextTurnIdentity, capturedByWhite, capturedByBlack },
        color,
      );
    },
    [gameId, tabEntryId, uid],
  );

  const resign = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;

    const doc = await chessGameService.getGame(gameId);
    if (!doc || doc.status !== "active" || doc.playerO === null) return;

    const isWhite = playerMatchesSeat(doc.playerX, uid, tabEntryId);
    const isBlack = playerMatchesSeat(doc.playerO, uid, tabEntryId);

    if (isWhite) {
      await chessGameService.resignGame(gameId, playerIdentity(doc.playerX));
    } else if (isBlack) {
      await chessGameService.resignGame(gameId, playerIdentity(doc.playerO));
    }
  }, [gameId, tabEntryId, uid]);

  const acceptRematch = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await chessGameService.acceptRematch(gameId, uid, tabEntryId === "" ? undefined : tabEntryId);
  }, [gameId, tabEntryId, uid]);

  const declineRematch = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await chessGameService.declineRematch(gameId, uid);
  }, [gameId, uid]);

  const notifyLeaveGame = useCallback(async () => {
    if (gameId === undefined || gameId === "") return;
    if (uid === "") return;
    await chessGameService.setDisconnected(gameId, uid);
  }, [gameId, uid]);

  return {
    commitMoveToFirebase,
    resignGame: resign,
    acceptRematch,
    declineRematch,
    notifyLeaveGame,
    myColor,
    whiteName,
    blackName,
  };
}
