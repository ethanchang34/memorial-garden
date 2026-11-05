import { Hono } from 'hono';
import type { AppEnv } from './env';
import { healthRoutes } from './routes/health';

export function createApp() {
  return new Hono<AppEnv>().route('/health', healthRoutes);
}
