import { useEffect, useState } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { dotsGameService } from "./dotsGameService";
import { docToState } from "./dotsGameMappers";
import type { GameMode } from "@/types/game";
import type { GameDoc } from "@/types/firebase";
import type { DotsGameState } from "../types";

export interface UseDotsOnlineOptions {
  readonly gameId?: string;
  readonly mode: GameMode;
}

export interface DotsOnlineState {
  myPlayerId: 1 | 2 | null;
  opponentName: string | null;
  myName: string | null;
  syncedState: DotsGameState | null;
  commitMoveToFirebase: (state: DotsGameState) => Promise<void>;
  resignGame: () => Promise<void>;
  isSubscribed: boolean;
}

export function useDotsOnline({ gameId, mode }: UseDotsOnlineOptions): DotsOnlineState {
  const uid = usePlayerStore((s) => s.uid);
  const [syncedState, setSyncedState] = useState<DotsGameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<1 | 2 | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Subscribe to game updates (online/friend modes only)
  useEffect(() => {
    if (!gameId || mode === "solo" || mode === "local" || !uid) {
      return;
    }

    setIsSubscribed(true);

    const unsubscribe = dotsGameService.subscribeDotsGame(gameId, (doc: GameDoc) => {
      const state = docToState(doc);
      setSyncedState(state);

      // Determine which player we are
      if (doc.playerX.uid === uid) {
        setMyPlayerId(1);
        setMyName(doc.playerX.queueEntryId ? "You" : doc.playerX.uid);
        if (doc.playerO) {
          setOpponentName(doc.playerO.queueEntryId ? "Opponent" : doc.playerO.uid);
        }
      } else if (doc.playerO && doc.playerO.uid === uid) {
        setMyPlayerId(2);
        setMyName(doc.playerO.queueEntryId ? "You" : doc.playerO.uid);
        if (doc.playerX) {
          setOpponentName(doc.playerX.queueEntryId ? "Opponent" : doc.playerX.uid);
        }
      }
    });

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [gameId, mode, uid]);

  const commitMoveToFirebase = async (state: DotsGameState): Promise<void> => {
    if (!gameId) return;
    await dotsGameService.commitMove(gameId, state);
  };

  const resignGame = async (): Promise<void> => {
    if (!gameId || !uid) return;
    await dotsGameService.resignGame(gameId, uid);
  };

  return {
    myPlayerId,
    opponentName,
    myName,
    syncedState,
    commitMoveToFirebase,
    resignGame,
    isSubscribed,
  };
}
