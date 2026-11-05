import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const healthRoutes = new Hono<AppEnv>().get('/', (context) =>
  context.json({ status: 'ok' }),
);
