import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuthActions } from './useAuthActions';

export function SignInPrompt({ message }: { message: string }) {
  const { t } = useTranslation();
  const { signIn, pending, available } = useAuthActions();

  return (
    <div className="border-border bg-card shadow-soft flex flex-col items-start gap-4 rounded-xl border p-6">
      <p className="text-muted-foreground text-lg leading-relaxed">{message}</p>
      <Button onClick={() => void signIn()} disabled={pending || !available}>
        {t('auth.signIn')}
      </Button>
    </div>
  );
}
