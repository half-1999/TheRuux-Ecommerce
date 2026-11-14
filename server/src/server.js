import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { initSentry } from './config/sentry.js';
import { createApp } from './app.js';
import { recordLog } from './utils/live-log.js';

const start = async () => {
  initSentry();
  const app = createApp();
  // Open the port before Mongo answers. Vite is already proxying by then, and a closed port prints ECONNREFUSED.
  const server = app.listen(env.port, () => {
    recordLog('system', { level: 'info', message: `API listening on port ${env.port}` });
    console.log(`TheRuux API listening on http://localhost:${env.port}`);
    console.log(
      `Integrations: cashfree=${env.cashfreeEnabled} (${env.cashfreeEnv}) cloudinary=${env.cloudinaryEnabled} email=${env.emailEnabled} sentry=${Boolean(env.sentryDsn)}`,
    );
  });
  try {
    await connectDb();
  } catch (err) {
    server.close();
    throw err;
  }
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
