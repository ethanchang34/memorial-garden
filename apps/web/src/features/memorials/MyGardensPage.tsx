import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/session';
import { SignInPrompt } from '@/features/auth/SignInPrompt';
import { useMyMemorials } from './useMemorials';

export function MyGardensPage() {
  const { t } = useTranslation();
  const session = useSession();

  return (
    <section className="mx-auto flex w-[min(100%-2rem,48rem)] flex-col gap-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>{t('memorial.mine.heading')}</h1>
        {session.status === 'signed-in' ? (
          <Button asChild>
            <Link to="/memorials/new">{t('home.createAction')}</Link>
          </Button>
        ) : null}
      </div>
      {session.status === 'signed-in' ? (
        <GardenList />
      ) : session.status === 'loading' ? null : (
        <SignInPrompt message={t('memorial.mine.signInPrompt')} />
      )}
    </section>
  );
}

function GardenList() {
  const { t } = useTranslation();
  const format = useDateFormat();
  const memorials = useMyMemorials();

  if (memorials.isPending) return <p className="text-muted-foreground">{t('common.loading')}</p>;
  if (memorials.isError) return <p role="alert">{t('memorial.mine.loadFailed')}</p>;
  if (memorials.data.length === 0)
    return <p className="text-muted-foreground text-lg">{t('memorial.mine.empty')}</p>;

  return (
    <ul className="flex flex-col gap-3">
      {memorials.data.map((memorial) => (
        <li key={memorial.id}>
          <Link
            to={`/m/${memorial.slug}`}
            className="min-h-touch border-border bg-card shadow-soft focus-visible:outline-ring can-hover:hover:shadow-lift flex flex-col gap-1 rounded-xl border p-5 transition-shadow focus-visible:outline-3 focus-visible:outline-offset-2"
          >
            <span className="font-display text-xl [overflow-wrap:anywhere]">
              {memorial.fullName}
            </span>
            <span className="text-muted-foreground">
              {format.lifespan(memorial.born, memorial.died)} ·{' '}
              {t(`memorial.status.${memorial.status}`)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
