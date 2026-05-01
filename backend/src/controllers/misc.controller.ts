import { Response } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../utils/crypto';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response';
import { AccountType, KYCStatus, Plan } from '../types/enums';
import { logger } from '../utils/logger';
import { config } from '../config/env';

// ─────────────────────────────────────────────
// CONNECTED ACCOUNTS
// ─────────────────────────────────────────────

export const listAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  const accounts = await prisma.connectedAccount.findMany({
    where: { userId: req.user!.userId, isActive: true },
    select: {
      id: true, provider: true, providerName: true, accountType: true,
      accountNumber: true, syncStatus: true, lastSyncedAt: true,
      holdingsJson: true, createdAt: true,
    },
  });

  const parsedAccounts = accounts.map(acc => ({
    ...acc,
    holdingsJson: acc.holdingsJson ? JSON.parse(acc.holdingsJson as string) : null
  }));

  sendSuccess(res, parsedAccounts);
};

export const connectAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const { provider, providerName, accountType, authCode, accountNumber } = req.body;
  if (!provider || !providerName) { sendError(res, 'Provider and name required'); return; }

  // In production: exchange authCode for tokens via OAuth
  const mockAccessToken = encrypt(`mock-access-token-${provider}-${Date.now()}`);

  const account = await prisma.connectedAccount.upsert({
    where: { userId_provider: { userId: req.user!.userId, provider } },
    update: { isActive: true, accessToken: mockAccessToken, syncStatus: 'PENDING', lastSyncedAt: null },
    create: {
      userId: req.user!.userId,
      provider,
      providerName,
      accountType: accountType as AccountType || AccountType.BANK,
      accessToken: mockAccessToken,
      accountNumber: accountNumber || null,
      syncStatus: 'PENDING',
    },
  });

  // Trigger background sync
  syncAccountHoldings(account.id, req.user!.userId).catch((e) => logger.error('Sync failed:', e));

  sendCreated(res, { id: account.id, provider, providerName, syncStatus: 'PENDING' }, 'Account connected. Syncing holdings...');
};

async function syncAccountHoldings(accountId: string, userId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 2000));

  const mockHoldings = {
    portfolioValue: Math.floor(Math.random() * 5000000) + 500000,
    lastUpdated: new Date().toISOString(),
    assets: [
      { name: 'HDFC Bank', qty: 100, currentValue: 167500 },
      { name: 'TCS', qty: 50, currentValue: 213750 },
      { name: 'Reliance', qty: 75, currentValue: 242625 },
    ],
  };

  await prisma.connectedAccount.update({
    where: { id: accountId },
    data: { holdingsJson: JSON.stringify(mockHoldings), syncStatus: 'SYNCED', lastSyncedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId, title: 'Account Synced', body: 'Your portfolio holdings have been updated.',
      type: 'ACCOUNT_SYNCED', data: JSON.stringify({ accountId }),
    },
  });
}

export const disconnectAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const acc = await prisma.connectedAccount.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!acc) { sendNotFound(res, 'Account not found'); return; }
  await prisma.connectedAccount.update({ where: { id: acc.id }, data: { isActive: false, accessToken: null } });
  sendSuccess(res, null, 'Account disconnected');
};

export const syncAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const acc = await prisma.connectedAccount.findFirst({
    where: { id: req.params.id, userId: req.user!.userId, isActive: true },
  });
  if (!acc) { sendNotFound(res, 'Account not found'); return; }
  await prisma.connectedAccount.update({ where: { id: acc.id }, data: { syncStatus: 'SYNCING' } });
  syncAccountHoldings(acc.id, req.user!.userId).catch((e) => logger.error(e));
  sendSuccess(res, null, 'Sync initiated');
};

// ─────────────────────────────────────────────
// WEALTH REPORTS
// ─────────────────────────────────────────────

export const listReports = async (req: AuthRequest, res: Response): Promise<void> => {
  const reports = await prisma.wealthReport.findMany({
    where: { userId: req.user!.userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, reports);
};

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title = 'Wealth Report', includeNetworth = true, expiryDays = 30, assets } = req.body;

  if (!assets || !Array.isArray(assets) || assets.length === 0) {
    sendError(res, 'Select at least one asset to include'); return;
  }

  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  const totalValue = assets.reduce((s: number, a: any) => s + (a.value || 0), 0);

  const report = await prisma.wealthReport.create({
    data: {
      userId: req.user!.userId,
      title,
      includeNetworth,
      expiresAt,
      totalValue,
      shareUrl: `${config.frontendUrl}/verify/${null}`, // will be updated below
      items: {
        create: assets.map((a: any) => ({
          assetName: a.name,
          assetType: a.type,
          value: a.value,
          documentId: a.documentId || null,
          metadata: a.metadata ? JSON.stringify(a.metadata) : null,
        })),
      },
    },
    include: { items: true },
  });

  // Update shareUrl with actual slug
  const updated = await prisma.wealthReport.update({
    where: { id: report.id },
    data: {
      shareUrl: `${config.frontendUrl}/verify/${report.shareToken}`,
      status: 'READY',
    },
  });

  // Generate QR code
  const qrDataUrl = await QRCode.toDataURL(updated.shareUrl!);

  await prisma.notification.create({
    data: {
      userId: req.user!.userId,
      title: 'Wealth Report Ready',
      body: 'Your wealth report has been generated and is ready to share.',
      type: 'REPORT_READY',
      data: JSON.stringify({ reportId: report.id }),
    },
  });

  sendCreated(res, { ...updated, qrCode: qrDataUrl }, 'Report generated successfully');
};

export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const report = await prisma.wealthReport.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: { items: { include: { document: { select: { id: true, title: true, docType: true, blockchainStatus: true } } } } },
  });
  if (!report) { sendNotFound(res, 'Report not found'); return; }

  const parsedReport = {
    ...report,
    items: report.items.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata as string) : null
    }))
  };

  sendSuccess(res, parsedReport);
};

// Public verify route (no auth required)
export const verifyReport = async (req: Request | any, res: Response): Promise<void> => {
  const { token } = req.params;
  const report = await prisma.wealthReport.findFirst({
    where: { shareToken: token, status: 'READY' },
    include: { items: true, user: { select: { name: true } } },
  });
  if (!report) { sendNotFound(res, 'Report not found or expired'); return; }
  if (report.expiresAt && report.expiresAt < new Date()) {
    await prisma.wealthReport.update({ where: { id: report.id }, data: { status: 'EXPIRED' } });
    sendError(res, 'Report has expired', 410); return;
  }
  await prisma.wealthReport.update({ where: { id: report.id }, data: { viewCount: { increment: 1 } } });
  
  const parsedReport = {
    ...report,
    items: report.items.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata as string) : null
    }))
  };

  sendSuccess(res, parsedReport, 'Report verified');
};

// ─────────────────────────────────────────────
// KYC
// ─────────────────────────────────────────────

export const submitKYC = async (req: AuthRequest, res: Response): Promise<void> => {
  const { aadhaar, pan, dob } = req.body;
  if (!aadhaar || !pan) { sendError(res, 'Aadhaar and PAN are required'); return; }

  const { hashPII } = await import('../utils/crypto');
  await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      aadhaarHash: hashPII(aadhaar.replace(/\s/g, '')),
      panHash: hashPII(pan.toUpperCase()),
      kycStatus: KYCStatus.SUBMITTED,
    },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'KYC_SUBMITTED', ipAddress: req.ip },
  });

  // Simulate auto-verification (production: send to NSDL/UIDAI API)
  setTimeout(async () => {
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { kycStatus: KYCStatus.VERIFIED, kycVerifiedAt: new Date() },
    });
  }, 5000);

  sendSuccess(res, { kycStatus: 'SUBMITTED' }, 'KYC submitted. Verification in progress (up to 24 hours).');
};

export const getKYCStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { kycStatus: true, kycVerifiedAt: true },
  });
  sendSuccess(res, user);
};

// ─────────────────────────────────────────────
// SECURITY SETTINGS
// ─────────────────────────────────────────────

export const getSecuritySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { biometricEnabled: true, twoFAEnabled: true, deadManEnabled: true, deadManDays: true, deviceId: true },
  });
  const devices = await prisma.refreshToken.findMany({
    where: { userId: req.user!.userId, revokedAt: null, expiresAt: { gte: new Date() } },
    select: { id: true, userAgent: true, ipAddress: true, createdAt: true, deviceId: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  sendSuccess(res, { ...user, activeSessions: devices });
};

export const updateSecuritySettings = async (req: AuthRequest, res: Response): Promise<void> => {
  const { biometricEnabled, deadManEnabled, deadManDays } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(biometricEnabled !== undefined && { biometricEnabled }),
      ...(deadManEnabled !== undefined && { deadManEnabled }),
      ...(deadManDays !== undefined && { deadManDays: parseInt(deadManDays) }),
    },
    select: { biometricEnabled: true, twoFAEnabled: true, deadManEnabled: true, deadManDays: true },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'SECURITY_SETTINGS_UPDATED', ipAddress: req.ip },
  });

  sendSuccess(res, user, 'Security settings updated');
};

export const revokeAllSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentRefreshToken } = req.body;
  await prisma.refreshToken.updateMany({
    where: {
      userId: req.user!.userId,
      ...(currentRefreshToken && { token: { not: currentRefreshToken } }),
    },
    data: { revokedAt: new Date() },
  });
  sendSuccess(res, null, 'All other sessions revoked');
};

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const listNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.userId },
      skip, take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId: req.user!.userId } }),
    prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } }),
  ]);

  const parsedNotifications = notifications.map(n => ({
    ...n,
    data: n.data ? JSON.parse(n.data as string) : null
  }));

  sendSuccess(res, parsedNotifications, 'Notifications fetched', 200, { total, unread, page: parseInt(page as string) });
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.notification.updateMany({
    where: { id, userId: req.user!.userId },
    data: { isRead: true, readAt: new Date() },
  });
  sendSuccess(res, null, 'Marked as read');
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  sendSuccess(res, null, 'All notifications marked as read');
};

// ─────────────────────────────────────────────
// DASHBOARD (Net Worth Aggregation)
// ─────────────────────────────────────────────

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  const [user, accounts, documents, nominees, recentActivity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, kycStatus: true, plan: true, walletAddress: true },
    }),
    prisma.connectedAccount.findMany({
      where: { userId, isActive: true, syncStatus: 'SYNCED' },
      select: { provider: true, providerName: true, holdingsJson: true, accountType: true },
    }),
    prisma.document.count({ where: { userId, isDeleted: false } }),
    prisma.nominee.count({ where: { userId, isActive: true } }),
    prisma.auditLog.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Aggregate net worth from connected accounts
  let totalNetworth = 124500000; // 1.24 Cr default for demo
  const assetBreakdown = {
    stocks: 56025000,
    mutualFunds: 37350000,
    fixedDeposits: 18675000,
    insurance: 12450000,
  };

  sendSuccess(res, {
    user,
    netWorth: { total: totalNetworth, change: 12.5, changeType: 'positive' },
    assetBreakdown,
    stats: { documents, nominees, connectedAccounts: accounts.length },
    recentActivity: recentActivity.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      createdAt: l.createdAt,
    })),
  });
};
