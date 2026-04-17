import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

import { auth } from "@/lib/firebase/client";
import type { AuthUserRef, IAuthService } from "@/lib/services/interfaces/IAuthService";

export class FirebaseAuthService implements IAuthService {
  async signInAnonymously(): Promise<AuthUserRef> {
    const credential = await signInAnonymously(auth);
    return { uid: credential.user.uid };
  }

  getCurrentUser(): AuthUserRef | null {
    const user = auth.currentUser;
    if (!user) return null;
    return { uid: user.uid };
  }

  onAuthStateChanged(cb: (user: AuthUserRef | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      cb(user ? { uid: user.uid } : null);
    });
  }
}
