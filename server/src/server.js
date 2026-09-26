import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { initSentry } from './config/sentry.js';
import { createApp } from './app.js';

const start = async () => {
  initSentry();
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`TheRuux API listening on http://localhost:${env.port}`);
    console.log(
      `Integrations: razorpay=${env.razorpayEnabled} cloudinary=${env.cloudinaryEnabled} email=${env.emailEnabled} sentry=${Boolean(env.sentryDsn)}`,
    );
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
