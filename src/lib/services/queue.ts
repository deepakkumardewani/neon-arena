import { FirebaseQueueService } from "@/lib/services/firebase/FirebaseQueueService";
import type { IQueueService } from "@/lib/services/interfaces/IQueueService";

export const queueService: IQueueService = new FirebaseQueueService();
