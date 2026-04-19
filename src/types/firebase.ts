import type { Timestamp } from "firebase/firestore";

import type { BoardCell } from "@/types/game";

export interface QueueEntry {
  readonly uid: string;
  readonly nickname: string;
  readonly joinedAt: Timestamp;
  readonly status: "waiting" | "matched";
}

/** Optional per-tab queue doc id so two clients with the same Firebase uid (same browser) stay distinct. */
export interface GameDocPlayer {
  readonly uid: string;
  readonly nickname: string;
  readonly queueEntryId?: string;
}

export interface GameDoc {
  readonly gameId: string;
  readonly playerX: GameDocPlayer;
  readonly playerO: GameDocPlayer | null;
  readonly board: readonly BoardCell[];
  readonly currentTurn: string;
  readonly status: "waiting" | "active" | "finished" | "abandoned" | "expired";
  /** Firestore stores player uid or the literal `"draw"`. */
  readonly winner: string | null;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly disconnectedAt: number | null;
  /** Uid of the player who triggered disconnect (leave mid-game or closed tab). */
  readonly disconnectedBy: string | null;
  readonly rematch: Readonly<Record<string, boolean>>;
  /** Set when both players accepted rematch; clients navigate to this game id. */
  readonly nextGameId?: string | null;
  /** When a player declines leaving after game (e.g. navigates home from overlay). */
  readonly rematchDeclined?: boolean;
  readonly rematchDeclinedBy?: string;
}

export interface PresenceEntry {
  readonly nickname: string;
  readonly connectedAt: number;
}
