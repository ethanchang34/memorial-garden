import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMyProfile } from '@/features/profile/useMyProfile';
import { useSession } from './session';
import { useAuthActions } from './useAuthActions';

export function AccountMenu() {
  const { t } = useTranslation();
  const session = useSession();
  const { signIn, signOut, pending } = useAuthActions();
  const profile = useMyProfile();

  if (session.status === 'unavailable' || session.status === 'loading') return null;

  if (session.status === 'signed-out') {
    return (
      <Button variant="secondary" size="small" onClick={() => void signIn()} disabled={pending}>
        {t('auth.signIn')}
      </Button>
    );
  }

  const displayName = profile.data?.displayName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="small" className="min-w-0 shrink sm:max-w-[16rem]">
          <span className="min-w-0 truncate">{displayName ?? t('auth.account')}</span>
          <ChevronDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {displayName ? (
          <DropdownMenuLabel>{t('auth.signedInAs', { name: displayName })}</DropdownMenuLabel>
        ) : null}
        <DropdownMenuItem asChild>
          <Link to="/settings/profile">
            <UserRound aria-hidden="true" />
            {t('profile.settingsLink')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onSelect={() => void signOut()}>
          <LogOut aria-hidden="true" />
          {t('auth.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
