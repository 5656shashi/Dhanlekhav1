import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { anchorDocumentProof, anchorApiIntegrationProof } from '../services/blockchain.service';

// ── Razorpay instance (test keys by default) ─────────────────────────────────
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

// ── Pricing ───────────────────────────────────────────────────────────────────
const PRICES: Record<string, number> = {
  DOCUMENT_UPLOAD: config.pricing.documentUpload,   // 500 paise = ₹5
  API_INTEGRATION: config.pricing.apiIntegration,   // 1000 paise = ₹10
};

const PRICE_LABELS: Record<string, string> = {
  DOCUMENT_UPLOAD: '₹5 – Document Upload',
  API_INTEGRATION: '₹10 – API Integration',
};

/**
 * POST /payments/create-order
 * Creates a Razorpay order for the requested action.
 * Body: { purpose: 'DOCUMENT_UPLOAD' | 'API_INTEGRATION', metadata?: object }
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { purpose, metadata } = req.body;

    if (!PRICES[purpose]) {
      sendError(res, `Unknown purpose. Valid: ${Object.keys(PRICES).join(', ')}`);
      return;
    }

    const amount = PRICES[purpose]; // in paise
    const receipt = `dl_${purpose.toLowerCase()}_${Date.now()}`;

    logger.info(`Step 1: Creating Razorpay order. Amount: ${amount}, Receipt: ${receipt}`);

    // Create Razorpay order
    const rpOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: { userId: req.user!.userId, purpose, ...metadata },
    });

    logger.info(`Step 2: Razorpay order created: ${rpOrder.id}. Saving to DB...`);

    // Persist pending transaction in DB
    const txn = await prisma.transaction.create({
      data: {
        userId: req.user!.userId,
        razorpayOrderId: rpOrder.id,
        amount: amount / 100, // store in rupees
        currency: 'INR',
        status: 'PENDING',
        purpose: purpose as any,
        metadata: metadata || null,
      },
    });

    sendCreated(res, {
      orderId: rpOrder.id,
      transactionId: txn.id,
      amount,              // paise (what Razorpay expects)
      amountDisplay: `₹${amount / 100}`,
      currency: 'INR',
      keyId: config.razorpay.keyId,
      description: PRICE_LABELS[purpose],
      receipt,
    }, 'Order created');
  } catch (error: any) {
    logger.error('Error in createOrder:', {
      message: error.message,
      code: error.code,
      metadata: error.metadata,
      stack: error.stack
    });
    console.error('CRITICAL PAYMENT ERROR:', error);
    sendError(res, error.message || 'Failed to create payment order', 500);
  }
};

/**
 * POST /payments/verify
 * Called by the app after Razorpay checkout completes.
 * Verifies HMAC signature, marks transaction SUCCESS, then auto-processes
 * the action that was paid for (document upload / API integration).
 *
 * Body: {
 *   transactionId,
 *   razorpayOrderId,
 *   razorpayPaymentId,
 *   razorpaySignature,
 *   // for DOCUMENT_UPLOAD:
 *   documentId?,
 *   // for API_INTEGRATION:
 *   provider?, providerName?, accountType?
 * }
 */
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    transactionId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    // DOCUMENT_UPLOAD fields
    documentId,
    documentTitle,
    documentType,
    // API_INTEGRATION fields
    provider,
    providerName,
    accountType,
  } = req.body;

  if (!transactionId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    sendError(res, 'Missing payment verification fields'); return;
  }

  // ── 1. Verify Razorpay HMAC signature ──────────────────────────────────────
  // In dev/test mode: allow demo signatures that start with 'test_sig_' (no real SDK needed)
  const isTestSig = config.isDev && razorpaySignature.startsWith('test_sig_');
  if (!isTestSig) {
    const expectedSig = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    if (expectedSig !== razorpaySignature) {
      sendError(res, 'Payment signature verification failed', 400); return;
    }
  }

  // ── 2. Fetch and validate our transaction record ───────────────────────────
  const txn = await prisma.transaction.findFirst({
    where: { id: transactionId, userId: req.user!.userId, status: 'PENDING' },
  });

  if (!txn) {
    sendError(res, 'Transaction not found or already processed', 404); return;
  }

  if (txn.razorpayOrderId !== razorpayOrderId) {
    sendError(res, 'Order ID mismatch', 400); return;
  }

  // ── 3. Mark transaction SUCCESS ───────────────────────────────────────────
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: 'SUCCESS', razorpayPaymentId, razorpaySignature },
  });

  logger.info(`Payment verified: txn ${transactionId}, purpose ${txn.purpose}`);

  // ── 4. Process the paid action ────────────────────────────────────────────
  let result: any = {};

  if (txn.purpose === 'DOCUMENT_UPLOAD') {
    // For document uploads, we don't create the record here.
    // The frontend will call POST /documents separately to handle the file upload.
    result = { status: 'PAID' };

  } else if (txn.purpose === 'API_INTEGRATION') {
    // a) Connect the account
    const { encrypt } = await import('../utils/crypto');
    const mockToken = encrypt(`mock-${provider}-${Date.now()}`);

    const account = await prisma.connectedAccount.upsert({
      where: { userId_provider: { userId: req.user!.userId, provider } },
      update: { isActive: true, accessToken: mockToken, syncStatus: 'PENDING' },
      create: {
        userId: req.user!.userId,
        provider,
        providerName,
        accountType: (accountType || 'BANK') as any,
        accessToken: mockToken,
        syncStatus: 'PENDING',
      },
    });

    // b) Update transaction with account reference
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { accountProvider: provider },
    });

    // c) Auto-anchor to blockchain + sync holdings (async)
    anchorApiIntegrationProof(account.id, provider, req.user!.userId, transactionId)
      .catch(e => logger.error('Blockchain anchor failed:', e));

    // Also kick off holdings sync
    syncHoldings(account.id, req.user!.userId).catch(() => {});

    result = { accountId: account.id, provider: provider, blockchainStatus: 'ANCHORING' };
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: `PAYMENT_${txn.purpose}_SUCCESS`,
      metadata: { transactionId, razorpayPaymentId, amount: txn.amount },
    },
  });

  sendSuccess(res, {
    transactionId,
    razorpayPaymentId,
    purpose: txn.purpose,
    amountPaid: `₹${txn.amount}`,
    ...result,
  }, 'Payment verified. Processing your request...');
};

/**
 * GET /payments/history
 * Returns the user's payment history.
 */
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  sendSuccess(res, transactions);
};

/**
 * GET /payments/transaction/:id
 * Get details of a specific transaction including blockchain proof.
 */
export const getTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  const txn = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!txn) { sendError(res, 'Transaction not found', 404); return; }
  sendSuccess(res, txn);
};

/**
 * POST /payments/webhook
 * Razorpay webhook for server-side payment confirmation.
 * Verify using webhook secret.
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = JSON.stringify(req.body);

  const expectedSig = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(body)
    .digest('hex');

  if (expectedSig !== signature) {
    logger.warn('Razorpay webhook signature mismatch');
    res.status(400).json({ error: 'Invalid signature' }); return;
  }

  const { event, payload } = req.body;
  logger.info(`Razorpay webhook: ${event}`);

  if (event === 'payment.captured') {
    const payment = payload.payment?.entity;
    if (payment) {
      await prisma.transaction.updateMany({
        where: { razorpayOrderId: payment.order_id, status: 'PENDING' },
        data: { status: 'SUCCESS', razorpayPaymentId: payment.id },
      });
    }
  }

  if (event === 'payment.failed') {
    const payment = payload.payment?.entity;
    if (payment) {
      await prisma.transaction.updateMany({
        where: { razorpayOrderId: payment.order_id },
        data: { status: 'FAILED' },
      });
    }
  }

  res.json({ status: 'ok' });
};

// ── Internal helper ───────────────────────────────────────────────────────────
async function syncHoldings(accountId: string, userId: string): Promise<void> {
  // Fetch account type to generate realistic type-specific holdings
  const account = await prisma.connectedAccount.findUnique({
    where: { id: accountId },
    select: { accountType: true, providerName: true },
  });
  const accountType = account?.accountType || 'BANK';

  const holdingsMap: Record<string, object> = {
    BANK:         { balance: Math.floor(Math.random() * 900000) + 100000, currency: 'INR', accountType: 'Savings', lastUpdated: new Date().toISOString() },
    BROKER:       { portfolioValue: Math.floor(Math.random() * 4000000) + 1000000, dayPnL: Math.floor((Math.random() - 0.3) * 20000), positions: Math.floor(Math.random() * 15) + 3, lastUpdated: new Date().toISOString() },
    MUTUAL_FUND:  { portfolioValue: Math.floor(Math.random() * 2000000) + 500000, invested: Math.floor(Math.random() * 1500000) + 400000, returns: (Math.random() * 15 + 8).toFixed(2) + '%', folios: Math.floor(Math.random() * 5) + 1, lastUpdated: new Date().toISOString() },
    INSURANCE:    { coverAmount: 10000000, premiumPaid: Math.floor(Math.random() * 200000) + 48000, policyStatus: 'Active', lastUpdated: new Date().toISOString() },
    OTHER:        { balance: Math.floor(Math.random() * 500000) + 50000, lastUpdated: new Date().toISOString() },
  };

  await new Promise(r => setTimeout(r, 2500));
  await prisma.connectedAccount.update({
    where: { id: accountId },
    data: { holdingsJson: holdingsMap[accountType] || holdingsMap.OTHER, syncStatus: 'SYNCED', lastSyncedAt: new Date() },
  });
}
/**
 * GET /payments/checkout/:id
 * Renders a full-screen, original Razorpay Checkout page.
 */
export const renderCheckoutPage = async (req: Request, res: Response): Promise<void> => {
  const txn = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: { user: true }
  });

  if (!txn || !txn.razorpayOrderId) {
    res.status(404).send('<h1>Payment session not found</h1>');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DhanLekha Secure Payment</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3399cc; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { color: #3399cc; margin: 0; }
          p { color: #64748b; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <h2>Opening Razorpay...</h2>
        <p>Please do not refresh this page.</p>

        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          const options = {
            "key": "${process.env.RAZORPAY_KEY_ID || 'rzp_test_pAnj7LpYFv8A4i'}",
            "amount": "${txn.amount * 100}",
            "currency": "INR",
            "name": "DhanLekha",
            "description": "${txn.purpose}",
            "image": "https://i.imgur.com/3g7nmJC.png",
            "order_id": "${txn.razorpayOrderId}",
            "handler": function (response) {
              // Redirect to a success page or back to app
              window.location.href = "/api/v1/payments/success?payment_id=" + response.razorpay_payment_id;
            },
            "prefill": {
              "name": "${txn.user.name || ''}",
              "email": "${txn.user.email || ''}",
              "contact": "${txn.user.phone || ''}"
            },
            "theme": { "color": "#14B8A6" },
            "modal": {
              "ondismiss": function() {
                window.location.href = "/api/v1/payments/cancel";
              }
            }
          };
          const rzp = new Razorpay(options);
          rzp.open();
        </script>
      </body>
    </html>
  `;

  res.send(html);
};
