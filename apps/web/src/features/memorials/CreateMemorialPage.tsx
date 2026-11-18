import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { MemorialError } from '@/core/memorial';
import { useSession } from '@/features/auth/session';
import { SignInPrompt } from '@/features/auth/SignInPrompt';
import { MemorialForm } from './MemorialForm';
import { useCreateMemorial } from './useMemorials';

export function CreateMemorialPage() {
  const { t } = useTranslation();
  const session = useSession();

  return (
    <section className="mx-auto flex w-[min(100%-2rem,40rem)] flex-col gap-6 py-10">
      <h1>{t('memorial.create.heading')}</h1>
      <p className="text-muted-foreground text-lg leading-relaxed">
        {t('memorial.create.priceNote')}
      </p>
      {session.status === 'signed-in' ? (
        <CreateForm />
      ) : session.status === 'loading' ? null : (
        <SignInPrompt message={t('memorial.create.signInPrompt')} />
      )}
    </section>
  );
}

function CreateForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateMemorial();

  return (
    <MemorialForm
      submitLabel={t('memorial.create.save')}
      savingLabel={t('memorial.create.saving')}
      pending={create.isPending}
      onSubmit={(input) =>
        create.mutate(input, {
          onSuccess: (memorial) => {
            toast(t('memorial.create.saved'));
            void navigate(`/m/${memorial.slug}`);
          },
          onError: (error) =>
            toast.error(
              error instanceof MemorialError && error.code === 'draft_limit'
                ? t('memorial.create.draftLimit')
                : t('memorial.create.saveFailed'),
            ),
        })
      }
    />
  );
}
