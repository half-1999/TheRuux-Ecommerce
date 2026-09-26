import * as Sentry from '@sentry/node';
import { env } from './env.js';

let initialized = false;

export const initSentry = () => {
  if (!env.sentryDsn || initialized) return;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.nodeEnv === 'production' ? 0.1 : 1.0,
  });
  initialized = true;
  console.log('Sentry initialized');
};

export const captureException = (err, context) => {
  if (!initialized) return;
  Sentry.captureException(err, context ? { extra: context } : undefined);
};

export { Sentry };
