import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import productsRoutes, { searchRouter } from './routes/products.routes.js';
import {
  categoriesRouter,
  collectionsRouter,
  homepageRouter,
  instagramRouter,
  pagesRouter,
  newsletterRouter,
  contactRouter,
} from './routes/catalog.routes.js';
import cartRoutes from './routes/cart.routes.js';
import wishlistRoutes from './routes/wishlist.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import paymentsRoutes, { webhookHandler } from './routes/payments.routes.js';
import { meRouter, ordersRouter } from './routes/me.routes.js';
import adminRoutes from './routes/admin.routes.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      originAgentCluster: false,
      strictTransportSecurity: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // Lets an HTTPS site (Vercel) call this API on localhost during local checks.
  app.use((req, res, next) => {
    if (req.headers['access-control-request-private-network']) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });

  const allowedOrigins = new Set([
    ...env.clientUrls.map((url) => new URL(url).origin),
    'https://the-ruux-ecommerce.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]);

  const isLocalDevOrigin = (value) => {
    if (env.nodeEnv === 'production') return false;
    try {
      const parsed = new URL(value);
      return (
        parsed.protocol === 'http:' &&
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
      );
    } catch {
      return false;
    }
  };

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        let normalized = origin;
        try {
          normalized = new URL(origin).origin;
        } catch {
          /* keep raw */
        }
        const vercelPreview = /^https:\/\/the-ruux-ecommerce(?:-[a-z0-9-]+)?\.vercel\.app$/.test(
          normalized,
        );
        if (allowedOrigins.has(normalized) || vercelPreview || isLocalDevOrigin(normalized)) {
          return callback(null, true);
        }
        console.warn(`[cors] blocked origin: ${origin}`);
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Token'],
    }),
  );
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  // Razorpay webhook — raw body for signature verification
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    webhookHandler,
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use('/uploads', express.static(path.resolve('uploads')));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/search', searchRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/collections', collectionsRouter);
  app.use('/api/homepage', homepageRouter);
  app.use('/api/instagram', instagramRouter);
  app.use('/api/pages', pagesRouter);
  app.use('/api/newsletter', newsletterRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/cart', cartRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/me', meRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
