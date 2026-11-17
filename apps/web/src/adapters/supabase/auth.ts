import type { User } from '@supabase/supabase-js';
import type { AuthProvider, AuthUser } from '@/core/auth';
import type { AppSupabaseClient } from './client';
import { linkConflictReturnUrl } from './linkConflict';

function toAuthUser(user: User): AuthUser {
  return { id: user.id, isAnonymous: user.is_anonymous ?? false };
}

export function createSupabaseAuth(client: AppSupabaseClient): AuthProvider {
  return {
    async signInWithGoogle(returnTo) {
      const { data } = await client.auth.getSession();
      if (data.session?.user.is_anonymous) {
        const { error } = await client.auth.linkIdentity({
          provider: 'google',
          options: { redirectTo: returnTo },
        });
        if (!error) return;
      }
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: returnTo },
      });
      if (error) throw error;
    },

    async resumeSignIn(currentUrl) {
      const returnTo = linkConflictReturnUrl(currentUrl);
      if (!returnTo) return false;
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: returnTo },
      });
      if (error) throw error;
      return true;
    },

    async signInAsVisitor(captchaToken) {
      const { data, error } = await client.auth.signInAnonymously(
        captchaToken ? { options: { captchaToken } } : undefined,
      );
      if (error) throw error;
      if (!data.user) throw new Error('No visitor session');
      return toAuthUser(data.user);
    },

    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },

    onChange(callback) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        callback(session ? toAuthUser(session.user) : null);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
