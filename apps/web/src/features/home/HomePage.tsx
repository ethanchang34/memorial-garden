import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <p className="eyebrow">{t('home.eyebrow')}</p>
        <h1 id="hero-heading">{t('home.heading')}</h1>
        <p className="hero-description">{t('home.description')}</p>
        <div className="hero-actions">
          <Button disabled>{t('home.createAction')}</Button>
          <Button disabled variant="secondary">
            {t('home.findAction')}
          </Button>
        </div>
      </div>
      <div className="garden-card" aria-hidden="true">
        <div className="garden-sky" />
        <div className="garden-hill" />
        <div className="garden-stone">
          <span className="stone-flower">✿</span>
          <span className="stone-line" />
          <span className="stone-line stone-line-short" />
        </div>
        <span className="garden-flower flower-one">✿</span>
        <span className="garden-flower flower-two">✿</span>
        <span className="garden-flower flower-three">✿</span>
      </div>
    </section>
  );
}
