import { useEffect } from "react";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { scoreService } from "@/lib/services";

const emptyScore = (uid: string, nickname: string) =>
  ({
    uid,
    nickname,
    wins: 0,
    losses: 0,
    draws: 0,
  }) as const;

/** Loads remote W/L/D for `uid` into `playerStore.score`. */
export function useScore(uid: string | undefined): void {
  const setScore = usePlayerStore((s) => s.setScore);

  useEffect(() => {
    if (uid === undefined || uid === "") return;

    let cancelled = false;
    const fallbackNick = usePlayerStore.getState().nickname.trim() || "Player";

    void scoreService.getScore(uid).then((doc) => {
      if (cancelled) return;
      if (doc !== null) {
        setScore(doc);
        return;
      }
      setScore(emptyScore(uid, fallbackNick));
    });

    return () => {
      cancelled = true;
    };
  }, [uid, setScore]);
}
