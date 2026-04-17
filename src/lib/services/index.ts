import { FirebaseAuthService } from "@/lib/services/firebase/FirebaseAuthService";
import type { IAuthService } from "@/lib/services/interfaces/IAuthService";
import type { IGameService } from "@/lib/services/interfaces/IGameService";
import type { IPresenceService } from "@/lib/services/interfaces/IPresenceService";
import type { IQueueService } from "@/lib/services/interfaces/IQueueService";
import type { IScoreService } from "@/lib/services/interfaces/IScoreService";
import type { GameDoc } from "@/types/firebase";
import type { ScoreDoc } from "@/types/player";

const noopUnsub = (): void => {};

class StubGameService implements IGameService {
  createGame(_playerX: { uid: string; nickname: string }): Promise<string> {
    return Promise.resolve("");
  }

  joinGame(_gameId: string, _playerO: { uid: string; nickname: string }): Promise<void> {
    return Promise.resolve();
  }

  makeMove(_gameId: string, _cellIndex: number, _player: "X" | "O"): Promise<void> {
    return Promise.resolve();
  }

  subscribeToGame(_gameId: string, _cb: (game: GameDoc) => void): () => void {
    return noopUnsub;
  }

  setDisconnected(_gameId: string, _uid: string): Promise<void> {
    return Promise.resolve();
  }

  acceptRematch(_gameId: string, _uid: string): Promise<string> {
    return Promise.resolve("");
  }

  getGame(_gameId: string): Promise<GameDoc | null> {
    return Promise.resolve(null);
  }
}

class StubScoreService implements IScoreService {
  getScore(_uid: string): Promise<ScoreDoc | null> {
    return Promise.resolve(null);
  }

  incrementScore(_uid: string, _result: "win" | "loss" | "draw", _nickname: string): Promise<void> {
    return Promise.resolve();
  }
}

class StubPresenceService implements IPresenceService {
  connect(_uid: string, _nickname: string): Promise<void> {
    return Promise.resolve();
  }

  disconnect(_uid: string): Promise<void> {
    return Promise.resolve();
  }

  subscribeToCount(_cb: (count: number) => void): () => void {
    return noopUnsub;
  }
}

class StubQueueService implements IQueueService {
  enqueue(_uid: string, _nickname: string): Promise<void> {
    return Promise.resolve();
  }

  dequeue(_uid: string): Promise<void> {
    return Promise.resolve();
  }

  subscribeToQueue(_cb: (queue: { uid: string; nickname: string }[]) => void): () => void {
    return noopUnsub;
  }
}

export const authService: IAuthService = new FirebaseAuthService();
export const gameService: IGameService = new StubGameService();
export const scoreService: IScoreService = new StubScoreService();
export const presenceService: IPresenceService = new StubPresenceService();
export const queueService: IQueueService = new StubQueueService();
