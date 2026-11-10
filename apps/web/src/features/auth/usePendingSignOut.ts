import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useServices } from '@/app/services';

export const SIGN_OUT_STATE = { signOut: true } as const;

function isSignOutState(state: unknown): boolean {
  return (
    typeof state === 'object' && state !== null && 'signOut' in state && state.signOut === true
  );
}

export function usePendingSignOut() {
  const services = useServices();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handledKey = useRef<string | null>(null);

  useEffect(() => {
    if (!services || !isSignOutState(location.state) || handledKey.current === location.key) return;
    handledKey.current = location.key;

    void navigate(location.pathname, { replace: true, state: null });
    services.auth
      .signOut()
      .then(() => toast(t('auth.signedOut')))
      .catch(() => toast.error(t('auth.signOutFailed')));
  }, [services, location, navigate, t]);
}
