export type AuthUser = {
  id: string;
};

export interface AuthProvider {
  signInWithGoogle(returnTo: string): Promise<void>;
  signOut(): Promise<void>;
  onChange(callback: (user: AuthUser | null) => void): () => void;
}
