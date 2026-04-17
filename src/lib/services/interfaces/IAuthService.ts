export interface AuthUserRef {
  readonly uid: string;
}

export interface IAuthService {
  signInAnonymously(): Promise<AuthUserRef>;
  getCurrentUser(): AuthUserRef | null;
  onAuthStateChanged(cb: (user: AuthUserRef | null) => void): () => void;
}
