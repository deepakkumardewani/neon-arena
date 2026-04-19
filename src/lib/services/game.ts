import { FirebaseGameService } from "@/lib/services/firebase/FirebaseGameService";
import type { IGameService } from "@/lib/services/interfaces/IGameService";

export const gameService: IGameService = new FirebaseGameService();
