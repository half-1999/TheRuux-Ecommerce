/**
 * Optional Sentry — enabled when VITE_SENTRY_DSN is set.
 */
import * as Sentry from '@sentry/react';

export const initClientSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    integrations: [Sentry.browserTracingIntegration()],
  });
};

export { Sentry };
