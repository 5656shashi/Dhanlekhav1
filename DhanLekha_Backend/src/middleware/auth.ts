import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { sendUnauthorized } from '../utils/response';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  user?: JWTPayload & { dbUser?: any };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendUnauthorized(res, 'Missing or invalid Authorization header');
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true },
      select: { id: true, phone: true, plan: true, kycStatus: true, isActive: true },
    });

    if (!user) {
      sendUnauthorized(res, 'User not found or inactive');
      return;
    }

    req.user = { ...payload, dbUser: user };

    // Update last active silently
    prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendUnauthorized(res, 'Token expired');
    } else if (err.name === 'JsonWebTokenError') {
      sendUnauthorized(res, 'Invalid token');
    } else {
      sendUnauthorized(res, 'Authentication failed');
    }
  }
};

export const requireKYC = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.dbUser?.kycStatus !== 'VERIFIED') {
    res.status(403).json({ success: false, message: 'KYC verification required' });
    return;
  }
  next();
};

export const requirePro = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.dbUser?.plan === 'FREE') {
    res.status(403).json({ success: false, message: 'Pro plan required for this feature' });
    return;
  }
  next();
};
