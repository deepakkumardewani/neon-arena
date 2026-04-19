export interface QueueWaiterSnapshot {
  readonly uid: string;
  readonly nickname: string;
  readonly joinedAtMs: number;
}

export interface MyQueueDocState {
  readonly status: string;
  readonly gameId: string | null;
}

export interface IQueueService {
  enqueue(uid: string, nickname: string): Promise<void>;
  dequeue(uid: string): Promise<void>;
  subscribeToQueue(cb: (queue: readonly QueueWaiterSnapshot[]) => void): () => void;
  /** Listen to this player's queue row for `status: matched` + game id. */
  subscribeMyQueue(uid: string, cb: (state: MyQueueDocState | null) => void): () => void;
  /**
   * Atomically pair two waiting players into an active game. Call only from the second player
   * (later `joinedAtMs`) to reduce duplicate attempts. Returns game id on success.
   */
  attemptPair(
    first: { uid: string; nickname: string },
    second: { uid: string; nickname: string },
  ): Promise<string | null>;
}
