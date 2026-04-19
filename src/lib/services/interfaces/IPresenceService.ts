export interface IPresenceService {
  /** Returns the push id under `presence/` so callers can remove exactly this session. */
  connect(uid: string, nickname: string): Promise<string>;
  disconnectSession(sessionKey: string): Promise<void>;
  disconnect(uid: string): Promise<void>;
  subscribeToCount(cb: (count: number) => void): () => void;
}
