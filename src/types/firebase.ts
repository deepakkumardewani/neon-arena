import type { Timestamp } from "firebase/firestore";

import type { BoardCell } from "@/types/game";

export interface QueueEntry {
  readonly uid: string;
  readonly nickname: string;
  readonly joinedAt: Timestamp;
  readonly status: "waiting" | "matched";
}

export interface GameDoc {
  readonly gameId: string;
  readonly playerX: { readonly uid: string; readonly nickname: string };
  readonly playerO: { readonly uid: string; readonly nickname: string } | null;
  readonly board: readonly BoardCell[];
  readonly currentTurn: string;
  readonly status: "waiting" | "active" | "finished" | "abandoned" | "expired";
  /** Firestore stores player uid or the literal `"draw"`. */
  readonly winner: string | null;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly disconnectedAt: number | null;
  readonly rematch: Readonly<Record<string, boolean>>;
}

export interface PresenceEntry {
  readonly nickname: string;
  readonly connectedAt: number;
}
