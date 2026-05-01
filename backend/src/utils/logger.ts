import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack ? `[${timestamp}] ${level}: ${message}\n${stack}` : `[${timestamp}] ${level}: ${message}`
  )
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: config.isDev ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    ...(config.isProd
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});
