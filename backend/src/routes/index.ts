import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, param, query } from 'express-validator';
import { authenticate, requireKYC } from '../middleware/auth';
import { config } from '../config/env';

// Controllers
import * as AuthCtrl from '../controllers/auth.controller';
import * as DocCtrl from '../controllers/document.controller';
import * as NomCtrl from '../controllers/nominee.controller';
import * as MiscCtrl from '../controllers/misc.controller';

const router = Router();

// ─── Multer (file uploads) ───────────────────
const uploadDir = config.storage.localPath;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG and WEBP files allowed'));
  },
});

// Validation helper
const validate = (validations: any[]) => [...validations];

// ─────────────────────────────────────────────
// AUTH ROUTES  /api/v1/auth
// ─────────────────────────────────────────────
router.post('/auth/send-otp',
  validate([body('phone').isMobilePhone('any'), body('type').optional().isIn(['LOGIN', 'REGISTER', 'KYC'])]),
  AuthCtrl.sendOTP
);

router.post('/auth/verify-otp',
  validate([body('phone').isMobilePhone('any'), body('code').isLength({ min: 6, max: 6 })]),
  AuthCtrl.verifyOTP
);

router.post('/auth/verify-pin',
  validate([body('phone').isMobilePhone('any'), body('pin').isLength({ min: 6, max: 6 })]),
  AuthCtrl.verifyPIN
);

router.post('/auth/refresh',
  validate([body('refreshToken').notEmpty()]),
  AuthCtrl.refreshTokens
);

router.post('/auth/set-pin', authenticate,
  validate([body('pin').isLength({ min: 6, max: 6 }).isNumeric()]),
  AuthCtrl.setPin
);

router.post('/auth/logout', authenticate, AuthCtrl.logout);

router.get('/auth/me', authenticate, AuthCtrl.getMe);

router.patch('/auth/me', authenticate,
  validate([body('name').optional().isString(), body('email').optional().isEmail()]),
  AuthCtrl.updateProfile
);

// ─────────────────────────────────────────────
// DASHBOARD  /api/v1/dashboard
// ─────────────────────────────────────────────
router.get('/dashboard', authenticate, MiscCtrl.getDashboard);

// ─────────────────────────────────────────────
// DOCUMENTS  /api/v1/documents
// ─────────────────────────────────────────────
router.get('/documents', authenticate, DocCtrl.listDocuments);

router.post('/documents', authenticate,
  upload.single('file'),
  validate([
    body('title').notEmpty().trim(),
    body('docType').isIn(['INSURANCE', 'FIXED_DEPOSIT', 'PROPERTY', 'MUTUAL_FUND', 'STOCK_CERTIFICATE', 'WILL', 'BANK_STATEMENT', 'PAN_CARD', 'AADHAAR', 'PASSPORT', 'OTHER']),
  ]),
  DocCtrl.uploadDocument
);

router.get('/documents/:id', authenticate, DocCtrl.getDocument);

router.get('/documents/:id/ocr', authenticate, DocCtrl.getOCRResults);

router.post('/documents/:id/blockchain', authenticate, DocCtrl.hashToBlockchain);

router.get('/documents/:id/blockchain', authenticate, DocCtrl.getBlockchainDetails);

router.get('/documents/:id/download', authenticate, DocCtrl.downloadDocument);

router.delete('/documents/:id', authenticate, DocCtrl.deleteDocument);

// ─────────────────────────────────────────────
// NOMINEES  /api/v1/nominees
// ─────────────────────────────────────────────
router.get('/nominees', authenticate, NomCtrl.listNominees);

router.post('/nominees', authenticate,
  validate([
    body('name').notEmpty().trim(),
    body('allocationPct').optional().isFloat({ min: 0, max: 100 }),
    body('nomineeType').optional().isIn(['INDIVIDUAL', 'NGO']),
    body('accessType').optional().isIn(['READ_ONLY', 'PARTIAL', 'FULL_VAULT']),
  ]),
  NomCtrl.createNominee
);

router.patch('/nominees/:id', authenticate, NomCtrl.updateNominee);

router.delete('/nominees/:id', authenticate, NomCtrl.revokeNominee);

router.post('/nominees/:nomineeId/documents/:documentId', authenticate, NomCtrl.grantDocumentAccess);

router.get('/ngos', authenticate, NomCtrl.listNGOs);

// ─────────────────────────────────────────────
// ACCOUNTS  /api/v1/accounts
// ─────────────────────────────────────────────
router.get('/accounts', authenticate, MiscCtrl.listAccounts);

router.post('/accounts', authenticate,
  validate([body('provider').notEmpty(), body('providerName').notEmpty()]),
  MiscCtrl.connectAccount
);

router.delete('/accounts/:id', authenticate, MiscCtrl.disconnectAccount);

router.post('/accounts/:id/sync', authenticate, MiscCtrl.syncAccount);

// ─────────────────────────────────────────────
// REPORTS  /api/v1/reports
// ─────────────────────────────────────────────
router.get('/reports', authenticate, MiscCtrl.listReports);

router.post('/reports', authenticate,
  validate([body('assets').isArray({ min: 1 })]),
  MiscCtrl.createReport
);

router.get('/reports/:id', authenticate, MiscCtrl.getReport);

// Public verification (no auth)
router.get('/verify/:token', MiscCtrl.verifyReport as any);

// ─────────────────────────────────────────────
// KYC  /api/v1/kyc
// ─────────────────────────────────────────────
router.post('/kyc/submit', authenticate,
  validate([
    body('aadhaar').matches(/^\d{4}\s?\d{4}\s?\d{4}$/),
    body('pan').matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/),
  ]),
  MiscCtrl.submitKYC
);

router.get('/kyc/status', authenticate, MiscCtrl.getKYCStatus);

// ─────────────────────────────────────────────
// SECURITY  /api/v1/security
// ─────────────────────────────────────────────
router.get('/security', authenticate, MiscCtrl.getSecuritySettings);

router.patch('/security', authenticate, MiscCtrl.updateSecuritySettings);

router.post('/security/revoke-sessions', authenticate, MiscCtrl.revokeAllSessions);

// ─────────────────────────────────────────────
// NOTIFICATIONS  /api/v1/notifications
// ─────────────────────────────────────────────
router.get('/notifications', authenticate, MiscCtrl.listNotifications);

router.patch('/notifications/:id/read', authenticate, MiscCtrl.markNotificationRead);

router.patch('/notifications/read-all', authenticate, MiscCtrl.markAllRead);

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

export default router;
