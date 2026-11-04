import { Hono } from 'hono';
import { sentry } from '@sentry/hono/cloudflare';

type Bindings = {
  Bindings: { SENTRY_DSN?: string };
};

const app = new Hono<Bindings>();

app.use(
  '*',
  sentry(app, {}),
);

app.get('/health', (context) => context.json({ status: 'ok' }));

export default app;
