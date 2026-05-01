import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface JWTPayload {
  userId: string;
  phone: string;
  plan: string;
}

export const signAccessToken = (payload: JWTPayload): string =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });

export const signRefreshToken = (payload: { userId: string }): string =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn as any });

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};
