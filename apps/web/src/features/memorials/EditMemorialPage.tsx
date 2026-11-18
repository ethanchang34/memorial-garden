import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Memorial } from '@/core/memorial';
import { useSession } from '@/features/auth/session';
import { SignInPrompt } from '@/features/auth/SignInPrompt';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { MemorialForm } from './MemorialForm';
import { useMemorial, useUpdateMemorial } from './useMemorials';

export function EditMemorialPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const session = useSession();
  const memorial = useMemorial(slug);

  if (session.status === 'loading' || memorial.isPending)
    return (
      <p className="text-muted-foreground mx-auto w-[min(100%-2rem,40rem)] py-10">
        {t('common.loading')}
      </p>
    );
  if (session.status !== 'signed-in')
    return (
      <section className="mx-auto flex w-[min(100%-2rem,40rem)] flex-col gap-6 py-10">
        <h1>{t('memorial.edit.heading')}</h1>
        <SignInPrompt message={t('memorial.edit.signInPrompt')} />
      </section>
    );
  if (memorial.isError)
    return (
      <p role="alert" className="mx-auto w-[min(100%-2rem,40rem)] py-10">
        {t('memorial.page.loadFailed')}
      </p>
    );
  if (!memorial.data || memorial.data.ownerId !== session.user.id) return <NotFoundPage />;
  return <EditForm memorial={memorial.data} />;
}

function EditForm({ memorial }: { memorial: Memorial }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const update = useUpdateMemorial(memorial.slug);

  return (
    <section className="mx-auto flex w-[min(100%-2rem,40rem)] flex-col gap-6 py-10">
      <h1>{t('memorial.edit.heading')}</h1>
      {memorial.status === 'published' ? (
        <p className="text-muted-foreground text-lg leading-relaxed">
          {t('memorial.edit.addressKept')}
        </p>
      ) : null}
      <MemorialForm
        initial={memorial}
        submitLabel={t('memorial.edit.save')}
        savingLabel={t('memorial.create.saving')}
        pending={update.isPending}
        onSubmit={(input) =>
          update.mutate(
            { id: memorial.id, input },
            {
              onSuccess: (saved) => {
                toast(t('memorial.edit.saved'));
                void navigate(`/m/${saved.slug}`, { replace: true });
              },
              onError: () => toast.error(t('memorial.edit.saveFailed')),
            },
          )
        }
        secondary={
          <Button asChild variant="ghost">
            <Link to={`/m/${memorial.slug}`}>{t('common.cancel')}</Link>
          </Button>
        }
      />
    </section>
  );
}
