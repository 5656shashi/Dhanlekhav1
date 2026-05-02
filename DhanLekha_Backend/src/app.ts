import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config/env';
import { logger } from './utils/logger';
import routes from './routes/index';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import { shieldFirewall, shieldRateLimiter, shieldPollution } from './middleware/shield.middleware';

const app = express();

// ─── Security ───────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// ─── CORS ───────────────────────────────────
app.use(cors({
  // In dev accept all origins; in prod restrict to config.cors.allowedOrigins
  origin: (origin, callback) => {
    if (config.isDev || !origin || config.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID', 'Accept', 'X-DhanLekha-Shield'],
}));

// ─── Rate Limiting ───────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: config.isDev ? 1000 : 15,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
});

app.use(globalLimiter);
app.use('/api/v1/auth', authLimiter);

// ─── Body Parsing ───────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── Security Lab Protection ─────────────
app.use(shieldRateLimiter);
app.use(shieldFirewall);
app.use(shieldPollution);

// ─── Logging ────────────────────────────────
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ─── Static Files (local uploads) ───────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ─────────────────────────────────
app.use(`/api/${config.apiVersion}`, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DhanLekha API',
    version: '1.0.0',
    status: 'running',
    docs: `/api/${config.apiVersion}/health`,
  });
});

// ─── Error Handlers ─────────────────────────
app.use('*', notFoundHandler);
app.use(globalErrorHandler);

export default app;
