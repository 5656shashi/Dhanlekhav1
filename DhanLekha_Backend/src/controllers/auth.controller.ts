import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOTP, hashPII } from '../utils/crypto';
import { sendSuccess, sendCreated, sendError, sendUnauthorized } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { OTPType } from '@prisma/client';

// Send OTP to phone
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  const { phone, type = 'LOGIN' } = req.body;

  if (!phone) { sendError(res, 'Phone number required'); return; }

  // Rate-check: max 3 OTPs per 10 minutes
  const recentOTPs = await prisma.oTP.count({
    where: {
      phone,
      type: type as OTPType,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
  });
  if (recentOTPs >= 3) { sendError(res, 'Too many OTP requests. Try again in 10 minutes.', 429); return; }

  // Invalidate previous OTPs
  await prisma.oTP.updateMany({
    where: { phone, type: type as OTPType, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = config.isDev ? '123456' : generateOTP(config.otp.length);
  const expiresAt = new Date(Date.now() + config.otp.expiresMinutes * 60 * 1000);

  await prisma.oTP.create({ data: { phone, code, type: type as OTPType, expiresAt } });

  // Send OTP via Twilio when credentials are configured
  if (config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber &&
      config.twilio.accountSid !== 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
    try {
      const twilio = require('twilio')(config.twilio.accountSid, config.twilio.authToken);
      await twilio.messages.create({
        body: `Your DhanLekha OTP is: ${code}. Valid for ${config.otp.expiresMinutes} minutes. Do not share.`,
        from: config.twilio.phoneNumber,
        to: phone,
      });
      logger.info(`OTP SMS sent to ${phone}`);
    } catch (smsError: any) {
      logger.warn(`SMS send failed (${smsError.message}) — OTP still valid in dev mode`);
    }
  }

  logger.info(`OTP sent to ${phone} (dev: ${config.isDev ? code : 'hidden'})`);

  sendSuccess(res, {
    phone,
    expiresAt,
    ...(config.isDev && { otp: code }),
  }, 'OTP sent successfully');
};

// Verify OTP and register/login
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { phone, code, deviceId, userAgent } = req.body;

  if (!phone || !code) { sendError(res, 'Phone and OTP are required'); return; }

  const otp = await prisma.oTP.findFirst({
    where: {
      phone,
      code,
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    await prisma.oTP.updateMany({
      where: { phone, usedAt: null },
      data: { attempts: { increment: 1 } },
    });
    sendError(res, 'Invalid or expired OTP', 401);
    return;
  }

  // Mark OTP as used
  await prisma.oTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

  // Upsert user
  let user = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({
      data: { phone, deviceId, lastLoginAt: new Date(), lastActiveAt: new Date() },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { deviceId, lastLoginAt: new Date(), lastActiveAt: new Date() },
    });
  }

  // Generate tokens
  const accessToken = signAccessToken({ userId: user.id, phone: user.phone, plan: user.plan });
  const refreshTokenStr = signRefreshToken({ userId: user.id });
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { token: refreshTokenStr, userId: user.id, deviceId, userAgent, expiresAt: refreshExpiresAt, ipAddress: req.ip },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: isNewUser ? 'USER_REGISTERED' : 'USER_LOGGED_IN', ipAddress: req.ip, userAgent },
  });

  sendSuccess(res, {
    accessToken,
    refreshToken: refreshTokenStr,
    isNewUser,
    user: { id: user.id, phone: user.phone, name: user.name, email: user.email, kycStatus: user.kycStatus, plan: user.plan },
  }, isNewUser ? 'Account created' : 'Login successful', isNewUser ? 201 : 200);
};

// Verify PIN (after biometric/re-auth)
export const verifyPIN = async (req: Request, res: Response): Promise<void> => {
  const { phone, pin, deviceId } = req.body;

  if (!phone || !pin) { sendError(res, 'Phone and PIN required'); return; }

  const user = await prisma.user.findUnique({ where: { phone, isActive: true } });
  if (!user?.pinHash) { sendError(res, 'PIN not set. Please login via OTP.', 401); return; }

  const valid = await bcrypt.compare(pin, user.pinHash);
  if (!valid) { sendUnauthorized(res, 'Invalid PIN'); return; }

  const accessToken = signAccessToken({ userId: user.id, phone: user.phone, plan: user.plan });
  const refreshTokenStr = signRefreshToken({ userId: user.id });

  await prisma.refreshToken.create({
    data: { token: refreshTokenStr, userId: user.id, deviceId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  });

  sendSuccess(res, { accessToken, refreshToken: refreshTokenStr }, 'PIN verified');
};

// Set/Change PIN
export const setPin = async (req: AuthRequest, res: Response): Promise<void> => {
  const { pin, currentPin } = req.body;
  const userId = req.user!.userId;

  if (!pin || pin.length !== 6) { sendError(res, 'PIN must be exactly 6 digits'); return; }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { sendError(res, 'User not found', 404); return; }

  // If changing PIN, verify current PIN
  if (user.pinHash && currentPin) {
    const valid = await bcrypt.compare(currentPin, user.pinHash);
    if (!valid) { sendError(res, 'Current PIN is incorrect', 401); return; }
  }

  const pinHash = await bcrypt.hash(pin, 12);
  await prisma.user.update({ where: { id: userId }, data: { pinHash } });

  await prisma.auditLog.create({ data: { userId, action: 'PIN_UPDATED', ipAddress: req.ip } });

  sendSuccess(res, null, 'PIN set successfully');
};

// Refresh access token
export const refreshTokens = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) { sendError(res, 'Refresh token required'); return; }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, revokedAt: null, expiresAt: { gte: new Date() } },
    });
    if (!stored) { sendUnauthorized(res, 'Invalid or revoked refresh token'); return; }

    const user = await prisma.user.findUnique({ where: { id: payload.userId, isActive: true } });
    if (!user) { sendUnauthorized(res, 'User not found'); return; }

    const newAccessToken = signAccessToken({ userId: user.id, phone: user.phone, plan: user.plan });
    const newRefreshToken = signRefreshToken({ userId: user.id });

    // Rotate refresh token
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });

    sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Tokens refreshed');
  } catch {
    sendUnauthorized(res, 'Invalid refresh token');
  }
};

// Logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId: req.user!.userId },
      data: { revokedAt: new Date() },
    });
  }
  await prisma.auditLog.create({ data: { userId: req.user!.userId, action: 'LOGGED_OUT', ipAddress: req.ip } });
  sendSuccess(res, null, 'Logged out successfully');
};

// Get current user profile
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, phone: true, email: true, name: true, avatarUrl: true,
      kycStatus: true, plan: true, planExpiresAt: true,
      biometricEnabled: true, twoFAEnabled: true, deadManEnabled: true, deadManDays: true,
      walletAddress: true, lastLoginAt: true, lastActiveAt: true, createdAt: true,
      _count: { select: { documents: true, nominees: true, connectedAccounts: true } },
    },
  });
  if (!user) { sendError(res, 'User not found', 404); return; }
  sendSuccess(res, user);
};

// Update profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { ...(name && { name }), ...(email && { email }) },
    select: { id: true, name: true, email: true, phone: true },
  });
  sendSuccess(res, user, 'Profile updated');
};
