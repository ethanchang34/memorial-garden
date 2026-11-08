import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';

export function RootLayout() {
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
        <Link className="brand" to="/" aria-label={t('brand.name')}>
          <span className="brand-mark" aria-hidden="true">
            ✿
          </span>
          <span>{t('brand.name')}</span>
        </Link>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">{t('home.comingSoon')}</footer>
    </>
  );
}
