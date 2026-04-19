import { FirebaseAuthService } from "@/lib/services/firebase/FirebaseAuthService";
import type { IAuthService } from "@/lib/services/interfaces/IAuthService";

export const authService: IAuthService = new FirebaseAuthService();
