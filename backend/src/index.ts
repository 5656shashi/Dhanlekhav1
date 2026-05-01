import app from './app';
import { config } from './config/env';
import { connectDB, disconnectDB } from './config/prisma';
import { startDeadManSwitch } from './services/deadManSwitch';
import { logger } from './utils/logger';

async function startServer(): Promise<void> {
  // Connect to database
  await connectDB();

  // Start HTTP server
  const server = app.listen(config.port, () => {
    logger.info(`
╔════════════════════════════════════════╗
║        DhanLekha API Server            ║
╠════════════════════════════════════════╣
║  Environment : ${config.env.padEnd(23)}║
║  Port        : ${String(config.port).padEnd(23)}║
║  API Base    : /api/${config.apiVersion.padEnd(20)}║
╚════════════════════════════════════════╝
    `);
  });

  // Start Dead-Man Switch cron job
  startDeadManSwitch();

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      logger.info('Server closed.');
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Promise Rejection:', reason);
    if (config.isProd) shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception:', err);
    shutdown('uncaughtException');
  });
}

startServer();
