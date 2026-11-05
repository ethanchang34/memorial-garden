import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HomePage } from '@/features/home/HomePage';

export function App() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('brand.name');
  }, [t]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        {t('accessibility.skipToContent')}
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label={t('brand.name')}>
          <span className="brand-mark" aria-hidden="true">
            ✿
          </span>
          <span>{t('brand.name')}</span>
        </a>
      </header>
      <main id="main-content">
        <HomePage />
      </main>
      <footer className="site-footer">{t('home.comingSoon')}</footer>
    </>
  );
}
