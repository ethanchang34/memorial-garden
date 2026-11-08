import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex w-[min(100%-2rem,40rem)] flex-col items-start gap-4 py-16">
      <h1>{t('notFound.heading')}</h1>
      <p className="text-muted-foreground text-lg leading-relaxed">{t('notFound.description')}</p>
      <Button asChild>
        <Link to="/">{t('notFound.homeAction')}</Link>
      </Button>
    </section>
  );
}
