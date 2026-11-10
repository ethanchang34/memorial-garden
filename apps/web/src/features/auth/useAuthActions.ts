import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useServices } from '@/app/services';

export function useAuthActions() {
  const services = useServices();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<void>, errorMessage: string) {
    setPending(true);
    try {
      await action();
    } catch {
      toast.error(errorMessage);
    } finally {
      setPending(false);
    }
  }

  return {
    available: Boolean(services),
    pending,
    signIn: () => {
      if (!services) return Promise.resolve();
      return run(
        () => services.auth.signInWithGoogle(window.location.href),
        t('auth.signInFailed'),
      );
    },
    signOut: () => {
      if (!services) return Promise.resolve();
      return run(async () => {
        await services.auth.signOut();
        await navigate('/', { replace: true });
        toast(t('auth.signedOut'));
      }, t('auth.signOutFailed'));
    },
  };
}
