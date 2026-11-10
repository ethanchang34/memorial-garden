import { createContext, useContext } from 'react';
import type { AuthUser } from '@/core/auth';

export type Session =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AuthUser };

export const SessionContext = createContext<Session>({ status: 'unavailable' });

export function useSession(): Session {
  return useContext(SessionContext);
}
