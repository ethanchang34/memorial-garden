import { ERROR_REPORTING_DATA_COLLECTION } from '@memorial-garden/shared';
import { sentry } from '@sentry/hono/cloudflare';
import { Hono } from 'hono';
import { createApp } from './app';
import type { AppEnv } from './env';

const app = new Hono<AppEnv>();

app.use(
  '*',
  sentry(app, (env) => ({
    dsn: env.SENTRY_DSN,
    environment: env.APP_ENV,
    enabled: Boolean(env.SENTRY_DSN),
    dataCollection: ERROR_REPORTING_DATA_COLLECTION,
  })),
);

app.route('/', createApp());

export default app;
