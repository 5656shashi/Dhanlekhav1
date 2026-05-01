import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};
