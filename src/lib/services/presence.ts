import { FirebasePresenceService } from "@/lib/services/firebase/FirebasePresenceService";
import type { IPresenceService } from "@/lib/services/interfaces/IPresenceService";

export const presenceService: IPresenceService = new FirebasePresenceService();
