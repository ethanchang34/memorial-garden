export type AuthUser = {
  id: string;
  isAnonymous: boolean;
};

export interface AuthProvider {
  signInWithGoogle(returnTo: string): Promise<void>;
  resumeSignIn(currentUrl: string): Promise<boolean>;
  signInAsVisitor(captchaToken: string | undefined): Promise<AuthUser>;
  signOut(): Promise<void>;
  onChange(callback: (user: AuthUser | null) => void): () => void;
}
