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
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.clientUrls.length === 1 ? env.clientUrls[0] : env.clientUrls,
      credentials: true,
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
