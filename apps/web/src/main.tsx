import { ERROR_REPORTING_DATA_COLLECTION } from '@memorial-garden/shared';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import '@/app/i18n';
import '@/styles/global.css';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  void import('@sentry/react').then((Sentry) =>
    Sentry.init({
      dsn: sentryDsn,
      environment: import.meta.env.MODE,
      dataCollection: ERROR_REPORTING_DATA_COLLECTION,
    }),
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element is missing');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
