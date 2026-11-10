import {
  DISPLAY_NAME_MAX_LENGTH,
  displayNameProblem,
  normalizeDisplayName,
  type DisplayNameProblem,
} from '@memorial-garden/shared';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/features/auth/session';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { useMyProfile, useUpdateDisplayName } from './useMyProfile';

export function ProfileSettingsPage() {
  const { t } = useTranslation();
  const session = useSession();

  return (
    <section className="mx-auto flex w-[min(100%-2rem,36rem)] flex-col gap-6 py-10">
      <h1>{t('profile.heading')}</h1>
      {session.status === 'signed-in' ? (
        <DisplayNameForm />
      ) : session.status === 'loading' ? null : (
        <SignInPrompt />
      )}
    </section>
  );
}

function SignInPrompt() {
  const { t } = useTranslation();
  const { signIn, pending, available } = useAuthActions();

  return (
    <div className="border-border bg-card shadow-soft flex flex-col items-start gap-4 rounded-xl border p-6">
      <p className="text-muted-foreground text-lg leading-relaxed">{t('profile.signInPrompt')}</p>
      <Button onClick={() => void signIn()} disabled={pending || !available}>
        {t('auth.signIn')}
      </Button>
    </div>
  );
}

function DisplayNameForm() {
  const { t } = useTranslation();
  const profile = useMyProfile();

  if (profile.isPending) return <p className="text-muted-foreground">{t('common.loading')}</p>;
  if (profile.isError) return <p role="alert">{t('profile.loadFailed')}</p>;

  return <DisplayNameFields key={profile.data.id} initialValue={profile.data.displayName} />;
}

const DISPLAY_NAME_ERRORS: Record<DisplayNameProblem, string> = {
  empty: 'profile.displayNameErrors.length',
  too_long: 'profile.displayNameErrors.length',
  characters: 'profile.displayNameErrors.characters',
  no_letter: 'profile.displayNameErrors.noLetter',
  reserved: 'profile.displayNameErrors.reserved',
  link: 'profile.displayNameErrors.link',
};

function DisplayNameFields({ initialValue }: { initialValue: string }) {
  const { t } = useTranslation();
  const update = useUpdateDisplayName();
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = displayNameProblem(value);
    if (problem) {
      setError(t(DISPLAY_NAME_ERRORS[problem], { max: DISPLAY_NAME_MAX_LENGTH }));
      return;
    }
    setError(null);
    update.mutate(normalizeDisplayName(value), {
      onSuccess: (saved) => {
        setValue(saved.displayName);
        toast(t('profile.saved'));
      },
      onError: () => toast.error(t('profile.saveFailed')),
    });
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="border-border bg-card shadow-soft flex flex-col gap-5 rounded-xl border p-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>{t('profile.displayNameLabel')}</Label>
        <Input
          id={inputId}
          name="displayName"
          autoComplete="nickname"
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${helpId} ${errorId}` : helpId}
        />
        <p id={helpId} className="text-muted-foreground text-sm">
          {t('profile.displayNameHelp')}
        </p>
        {error ? (
          <p id={errorId} role="alert" className="text-destructive text-sm font-bold">
            {error}
          </p>
        ) : null}
      </div>
      <div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? t('profile.saving') : t('profile.save')}
        </Button>
      </div>
    </form>
  );
}
