export interface IQueueService {
  enqueue(uid: string, nickname: string): Promise<void>;
  dequeue(uid: string): Promise<void>;
  subscribeToQueue(cb: (queue: { uid: string; nickname: string }[]) => void): () => void;
}
