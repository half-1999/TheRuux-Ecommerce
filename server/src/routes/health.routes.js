import { Router } from 'express';
import mongoose from 'mongoose';
import { getDbState } from '../config/db.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDbState();
  const ok = db === 'connected';
  res.status(ok ? 200 : 503).json({
    ok,
    service: 'theruux-api',
    db,
    mongoReadyState: mongoose.connection.readyState,
    integrations: {
      razorpay: env.razorpayEnabled,
      cloudinary: env.cloudinaryEnabled,
      email: env.emailEnabled,
      sentry: Boolean(env.sentryDsn),
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
