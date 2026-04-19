import { doc, getDoc, increment, setDoc, type DocumentData } from "firebase/firestore";

import { db } from "@/lib/firebase/firestoreDb";
import type { IScoreService } from "@/lib/services/interfaces/IScoreService";
import type { ScoreDoc } from "@/types/player";

const SCORES = "scores";

function readFiniteInt(value: DocumentData[string]): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toScoreDoc(uid: string, data: DocumentData): ScoreDoc {
  const wins = readFiniteInt(data.wins);
  const losses = readFiniteInt(data.losses);
  const draws = readFiniteInt(data.draws);
  const nickname = typeof data.nickname === "string" ? data.nickname : "";
  return { uid, nickname, wins, losses, draws };
}

export class FirebaseScoreService implements IScoreService {
  async getScore(uid: string): Promise<ScoreDoc | null> {
    const ref = doc(db, SCORES, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return toScoreDoc(uid, snap.data());
  }

  async incrementScore(
    uid: string,
    result: "win" | "loss" | "draw",
    nickname: string,
  ): Promise<void> {
    const ref = doc(db, SCORES, uid);
    const dWin = result === "win" ? 1 : 0;
    const dLoss = result === "loss" ? 1 : 0;
    const dDraw = result === "draw" ? 1 : 0;
    await setDoc(
      ref,
      {
        nickname,
        wins: increment(dWin),
        losses: increment(dLoss),
        draws: increment(dDraw),
      },
      { merge: true },
    );
  }
}
