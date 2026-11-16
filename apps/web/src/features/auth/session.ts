import { createContext, useContext } from 'react';
import type { AuthUser } from '@/core/auth';

export type Session =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'visitor'; user: AuthUser }
  | { status: 'signed-in'; user: AuthUser };

export const SessionContext = createContext<Session>({ status: 'unavailable' });

export function useSession(): Session {
  return useContext(SessionContext);
}

export function sessionUser(session: Session): AuthUser | null {
  return session.status === 'signed-in' || session.status === 'visitor' ? session.user : null;
}
