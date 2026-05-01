import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation middleware (runs after express-validator)
export const handleValidation = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: (e as any).path, message: e.msg })),
    });
    return;
  }
  next();
};

// Global error handler
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;

  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    statusCode: err.statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    res.status(409).json({ success: false, message: 'Resource already exists (duplicate key)' });
    return;
  }
  if (err.code === 'P2025') {
    res.status(404).json({ success: false, message: 'Record not found' });
    return;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ success: false, message: 'File too large (max 20MB)' });
    return;
  }

  if (err.isOperational) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Unknown/unexpected errors
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
