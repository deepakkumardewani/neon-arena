import { FirebaseScoreService } from "@/lib/services/firebase/FirebaseScoreService";
import type { IScoreService } from "@/lib/services/interfaces/IScoreService";

export const scoreService: IScoreService = new FirebaseScoreService();
