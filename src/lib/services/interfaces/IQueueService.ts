export interface QueueWaiterSnapshot {
  /** Firestore document id (may include a per-tab suffix; see `getMatchmakingQueueEntryId`). */
  readonly queueEntryId: string;
  /** Firebase Auth uid — used for `games` docs and security rules. */
  readonly authUid: string;
  readonly nickname: string;
  readonly joinedAtMs: number;
}

export interface MyQueueDocState {
  readonly status: string;
  readonly gameId: string | null;
}

export interface IQueueService {
  enqueue(queueEntryId: string, authUid: string, nickname: string): Promise<void>;
  dequeue(queueEntryId: string): Promise<void>;
  subscribeToQueue(cb: (queue: readonly QueueWaiterSnapshot[]) => void): () => void;
  /** Listen to this player's queue row for `status: matched` + game id. */
  subscribeMyQueue(queueEntryId: string, cb: (state: MyQueueDocState | null) => void): () => void;
  /**
   * Atomically pair two waiting players into an active game. Call only from the second player
   * (later `joinedAtMs`) to reduce duplicate attempts. Returns game id on success.
   */
  attemptPair(
    first: { queueEntryId: string; authUid: string; nickname: string },
    second: { queueEntryId: string; authUid: string; nickname: string },
  ): Promise<string | null>;
}
