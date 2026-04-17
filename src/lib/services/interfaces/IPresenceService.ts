export interface IPresenceService {
  connect(uid: string, nickname: string): Promise<void>;
  disconnect(uid: string): Promise<void>;
  subscribeToCount(cb: (count: number) => void): () => void;
}
