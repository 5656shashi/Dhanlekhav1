import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { handleValidation } from '../middleware/errorHandler';
import { config } from '../config/env';

import * as AuthCtrl from '../controllers/auth.controller';
import * as DocCtrl from '../controllers/document.controller';
import * as NomCtrl from '../controllers/nominee.controller';
import * as MiscCtrl from '../controllers/misc.controller';
import * as PayCtrl from '../controllers/payment.controller';
import * as FuzzCtrl from '../controllers/fuzz.controller';
import * as SecurityCtrl from '../controllers/security.controller';

const router = Router();

// ── File Upload ──────────────────────────────────────────────────────────────
const uploadDir = config.storage.localPath;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const uploader = multer({
  storage: multerStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, JPG, PNG and WEBP allowed'));
  },
});

// File is optional for demo (backend accepts metadata-only uploads)
const optionalUpload = (req: Request, res: Response, next: NextFunction) => {
  uploader.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError || err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (_req, res) =>
  res.json({ status: 'ok', version: '1.0.0', ts: new Date().toISOString() })
);

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/send-otp',
  [body('phone').notEmpty().withMessage('Phone is required')],
  handleValidation, AuthCtrl.sendOTP);
router.post('/auth/verify-otp',
  [body('phone').notEmpty(), body('code').isLength({ min: 6, max: 6 })],
  handleValidation, AuthCtrl.verifyOTP);
router.post('/auth/verify-pin',
  [body('phone').notEmpty(), body('pin').isLength({ min: 6, max: 6 })],
  handleValidation, AuthCtrl.verifyPIN);
router.post('/auth/refresh',
  [body('refreshToken').notEmpty()], handleValidation, AuthCtrl.refreshTokens);
router.post('/auth/set-pin', authenticate,
  [body('pin').isLength({ min: 6, max: 6 }).isNumeric()],
  handleValidation, AuthCtrl.setPin);
router.post('/auth/logout', authenticate, AuthCtrl.logout);
router.get('/auth/me', authenticate, AuthCtrl.getMe);
router.patch('/auth/me', authenticate,
  [body('name').optional().trim(), body('email').optional().isEmail()],
  handleValidation, AuthCtrl.updateProfile);

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', authenticate, MiscCtrl.getDashboard);

// ── Documents ────────────────────────────────────────────────────────────────
router.get('/documents', authenticate, DocCtrl.listDocuments);
// Document upload — requires prior payment (transactionId in body)
router.post('/documents', authenticate, optionalUpload,
  [body('title').notEmpty().trim(), body('docType').notEmpty()],
  handleValidation, DocCtrl.uploadDocument);
router.get('/documents/:id', authenticate, DocCtrl.getDocument);
router.get('/documents/:id/ocr', authenticate, DocCtrl.getOCRResults);
router.get('/documents/:id/blockchain', authenticate, DocCtrl.getBlockchainDetails);
router.post('/documents/:id/blockchain', authenticate, DocCtrl.hashToBlockchain);
router.get('/documents/:id/download', authenticate, DocCtrl.downloadDocument);
router.delete('/documents/:id', authenticate, DocCtrl.deleteDocument);

// ── Nominees ─────────────────────────────────────────────────────────────────
router.get('/nominees', authenticate, NomCtrl.listNominees);
router.post('/nominees', authenticate,
  [body('name').notEmpty().trim(),
   body('allocationPct').optional().isFloat({ min: 0, max: 100 }),
   body('nomineeType').optional().isIn(['INDIVIDUAL', 'NGO']),
   body('accessType').optional().isIn(['READ_ONLY', 'PARTIAL', 'FULL_VAULT'])],
  handleValidation, NomCtrl.createNominee);
router.patch('/nominees/:id', authenticate, NomCtrl.updateNominee);
router.delete('/nominees/:id', authenticate, NomCtrl.revokeNominee);
router.post('/nominees/:nomineeId/documents/:documentId', authenticate, NomCtrl.grantDocumentAccess);
router.get('/ngos', authenticate, NomCtrl.listNGOs);

// ── Accounts ──────────────────────────────────────────────────────────────────
router.get('/accounts', authenticate, MiscCtrl.listAccounts);
// Account connect — requires prior payment (transactionId in body)
router.post('/accounts', authenticate,
  [body('provider').notEmpty(), body('providerName').notEmpty(),
   body('transactionId').notEmpty().withMessage('Payment required — provide transactionId')],
  handleValidation, MiscCtrl.connectAccount);
router.delete('/accounts/:id', authenticate, MiscCtrl.disconnectAccount);
router.post('/accounts/:id/sync', authenticate, MiscCtrl.syncAccount);

// ── Payments ─────────────────────────────────────────────────────────────────
router.post('/payments/create-order', authenticate,
  [body('purpose').isIn(['DOCUMENT_UPLOAD', 'API_INTEGRATION']).withMessage('Invalid purpose')],
  handleValidation, PayCtrl.createOrder);
router.post('/payments/verify', authenticate,
  [body('transactionId').notEmpty(), body('razorpayOrderId').notEmpty(),
   body('razorpayPaymentId').notEmpty(), body('razorpaySignature').notEmpty()],
  handleValidation, PayCtrl.verifyPayment);
router.get('/payments/history', authenticate, PayCtrl.getPaymentHistory);
router.get('/payments/checkout/:id', PayCtrl.renderCheckoutPage);
router.get('/payments/:id', authenticate, PayCtrl.getTransaction);
// Razorpay webhook — no auth (verified by HMAC)
router.post('/payments/webhook', PayCtrl.handleWebhook);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports', authenticate, MiscCtrl.listReports);
router.post('/reports', authenticate,
  [body('assets').isArray({ min: 1 })], handleValidation, MiscCtrl.createReport);
router.get('/reports/:id', authenticate, MiscCtrl.getReport);
router.get('/verify/:token', MiscCtrl.verifyReport as any);

// ── KYC ───────────────────────────────────────────────────────────────────────
router.post('/kyc/submit', authenticate,
  [body('aadhaar').notEmpty(), body('pan').notEmpty()],
  handleValidation, MiscCtrl.submitKYC);
router.get('/kyc/status', authenticate, MiscCtrl.getKYCStatus);

// ── Security ──────────────────────────────────────────────────────────────────
router.get('/security', authenticate, MiscCtrl.getSecuritySettings);
router.patch('/security', authenticate, MiscCtrl.updateSecuritySettings);
router.post('/security/revoke-sessions', authenticate, MiscCtrl.revokeAllSessions);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications', authenticate, MiscCtrl.listNotifications);
router.patch('/notifications/:id/read', authenticate, MiscCtrl.markNotificationRead);
router.patch('/notifications/read-all', authenticate, MiscCtrl.markAllRead);

// ── Security Lab (Fuzz Testing) ──────────────────────────────────────────────
router.post('/fuzz/sessions', authenticate, FuzzCtrl.startSession);
router.get('/fuzz/sessions', authenticate, FuzzCtrl.listSessions);
router.get('/fuzz/sessions/:id', authenticate, FuzzCtrl.getSession);
router.post('/fuzz/sessions/:id/stop', authenticate, FuzzCtrl.stopSession);
router.get('/fuzz/sessions/:id/results', authenticate, FuzzCtrl.getResults);
router.get('/fuzz/sessions/:id/export', authenticate, FuzzCtrl.exportReport);

router.get('/security/shield/status', SecurityCtrl.getShieldStatus);
router.post('/security/shield/toggle', SecurityCtrl.toggleShield);

export default router;
