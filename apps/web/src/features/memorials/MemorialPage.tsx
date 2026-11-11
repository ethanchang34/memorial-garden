import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import { MemorialError, type Memorial } from '@/core/memorial';
import { useSession } from '@/features/auth/session';
import { GardenScene } from '@/features/garden/GardenScene';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { useMemorial, usePublishMemorial } from './useMemorials';

export function MemorialPage() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const memorial = useMemorial(slug);

  if (memorial.isPending)
    return (
      <p className="text-muted-foreground mx-auto w-[min(100%-2rem,40rem)] py-10">
        {t('common.loading')}
      </p>
    );
  if (memorial.isError)
    return (
      <p role="alert" className="mx-auto w-[min(100%-2rem,40rem)] py-10">
        {t('memorial.page.loadFailed')}
      </p>
    );
  if (!memorial.data) return <NotFoundPage />;
  return <MemorialView memorial={memorial.data} />;
}

function MemorialView({ memorial }: { memorial: Memorial }) {
  const { t } = useTranslation();
  const format = useDateFormat();
  const session = useSession();
  const publish = usePublishMemorial(memorial.slug);
  const isOwner = session.status === 'signed-in' && session.user.id === memorial.ownerId;

  function onShare() {
    publish.mutate(memorial.id, {
      onSuccess: () => toast(t('memorial.page.published')),
      onError: (error) =>
        toast.error(
          error instanceof MemorialError && error.code === 'sharing_closed'
            ? t('memorial.page.sharingClosed')
            : t('memorial.page.publishFailed'),
        ),
    });
  }

  return (
    <article className="mx-auto flex w-[min(100%-2rem,48rem)] flex-col gap-8 py-10">
      {memorial.status === 'draft' && isOwner ? (
        <div
          role="status"
          className="border-border bg-muted flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-base">{t('memorial.page.draftNotice')}</p>
          <Button onClick={onShare} disabled={publish.isPending}>
            {t('memorial.page.share')}
          </Button>
        </div>
      ) : null}
      <figure className="border-border shadow-lift overflow-hidden rounded-xl border">
        <GardenScene
          name={memorial.fullName}
          dates={format.lifespan(memorial.born, memorial.died)}
          label={t('memorial.page.gardenLabel', { name: memorial.fullName })}
        />
      </figure>
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="max-w-full [overflow-wrap:anywhere]">{memorial.fullName}</h1>
        <p className="font-display text-muted-foreground text-xl">
          {format.lifespan(memorial.born, memorial.died)}
        </p>
        {memorial.epitaph ? (
          <p className="max-w-prose text-lg leading-relaxed">{memorial.epitaph}</p>
        ) : null}
      </header>
    </article>
  );
}
