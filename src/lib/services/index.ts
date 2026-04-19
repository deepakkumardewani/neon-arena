import { FirebaseAuthService } from "@/lib/services/firebase/FirebaseAuthService";
import { FirebaseGameService } from "@/lib/services/firebase/FirebaseGameService";
import { FirebasePresenceService } from "@/lib/services/firebase/FirebasePresenceService";
import { FirebaseQueueService } from "@/lib/services/firebase/FirebaseQueueService";
import { FirebaseScoreService } from "@/lib/services/firebase/FirebaseScoreService";
import type { IAuthService } from "@/lib/services/interfaces/IAuthService";
import type { IGameService } from "@/lib/services/interfaces/IGameService";
import type { IPresenceService } from "@/lib/services/interfaces/IPresenceService";
import type { IQueueService } from "@/lib/services/interfaces/IQueueService";
import type { IScoreService } from "@/lib/services/interfaces/IScoreService";

export const authService: IAuthService = new FirebaseAuthService();
export const gameService: IGameService = new FirebaseGameService();
export const scoreService: IScoreService = new FirebaseScoreService();
export const presenceService: IPresenceService = new FirebasePresenceService();
export const queueService: IQueueService = new FirebaseQueueService();
