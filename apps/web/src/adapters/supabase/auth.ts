import type { AuthProvider } from '@/core/auth';
import type { AppSupabaseClient } from './client';

export function createSupabaseAuth(client: AppSupabaseClient): AuthProvider {
  return {
    async signInWithGoogle(returnTo) {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: returnTo },
      });
      if (error) throw error;
    },

    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },

    onChange(callback) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        callback(session ? { id: session.user.id } : null);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
