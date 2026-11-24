import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './docs/swagger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import ticketRoutes from './routes/ticket.routes';

export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // Serve Swagger UI before strict Helmet CSP so inline UI assets load cleanly
  app.get('/api/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use(
    '/api/docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { explorer: true }),
  );

  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
      status: 'error',
      message: 'Too many requests, please try again later',
    },
  });
  app.use('/api', globalRateLimiter);

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'tixflow-backend',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/tickets', ticketRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
