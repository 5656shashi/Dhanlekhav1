import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { hashDocument, encrypt, decrypt, generateToken } from '../utils/crypto';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response';
import { DocumentType, DocumentStatus, BlockchainStatus, ProcessingStatus } from '../types/enums';
import { logger } from '../utils/logger';

// List all documents for current user
export const listDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, status, search, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { userId: req.user!.userId, isDeleted: false };
  if (type) where.docType = type as DocumentType;
  if (status) where.status = status as DocumentStatus;
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { issuedBy: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, docType: true, category: true,
        ocrStatus: true, blockchainStatus: true, status: true,
        documentHash: true, txHash: true, issuedBy: true,
        issuedDate: true, expiryDate: true, createdAt: true,
        fileSize: true, mimeType: true,
      },
    }),
    prisma.document.count({ where }),
  ]);

  sendSuccess(res, documents, 'Documents fetched', 200, {
    total,
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    pages: Math.ceil(total / parseInt(limit as string)),
  });
};

// Get single document
export const getDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user!.userId, isDeleted: false },
  });
  if (!doc) { sendNotFound(res, 'Document not found'); return; }

  // Don't expose encryption key or raw file URL in response
  const { encryptionKey, fileUrl, ...safeDoc } = doc;
  sendSuccess(res, safeDoc);
};

// Upload document
export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) { sendError(res, 'No file uploaded'); return; }

  const { title, docType, category, issuedBy, issuedDate, expiryDate } = req.body;
  if (!title || !docType) { sendError(res, 'Title and document type are required'); return; }

  const fileBuffer = fs.readFileSync(req.file.path);
  const documentHash = hashDocument(fileBuffer);
  const perDocKey = generateToken(16); // 32-char hex = 16 bytes
  const encryptedKey = encrypt(perDocKey);

  const doc = await prisma.document.create({
    data: {
      userId: req.user!.userId,
      title,
      docType: docType as DocumentType,
      category,
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      encryptionKey: encryptedKey,
      documentHash,
      ocrStatus: ProcessingStatus.PENDING,
      blockchainStatus: BlockchainStatus.UNVERIFIED,
      issuedBy,
      issuedDate: issuedDate ? new Date(issuedDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'DOCUMENT_UPLOADED', entity: 'Document', entityId: doc.id },
  });

  // Trigger async OCR processing (in production, enqueue to job queue)
  processDocumentOCR(doc.id).catch((e) => logger.error('OCR failed:', e));

  sendCreated(res, { id: doc.id, title: doc.title, documentHash, ocrStatus: 'PENDING' }, 'Document uploaded. AI processing initiated.');
};

// Simulated OCR processing (replace with real AI/OCR service)
async function processDocumentOCR(docId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 2000)); // simulate delay

  await prisma.document.update({
    where: { id: docId },
    data: {
      ocrStatus: ProcessingStatus.PROCESSING,
    },
  });

  await new Promise((r) => setTimeout(r, 3000));

  // Mock OCR results
  const mockOcrData = {
    documentType: 'Life Insurance Policy',
    policyNumber: 'POL-2023-8901X',
    holderName: 'Arjun Mehta',
    expiryDate: '14 Oct 2045',
    sumAssured: '₹1,00,00,000',
    premium: '₹48,000/year',
    confidenceScores: { documentType: 0.99, policyNumber: 0.98, holderName: 0.96 },
  };

  await prisma.document.update({
    where: { id: docId },
    data: {
      ocrStatus: ProcessingStatus.COMPLETED,
      ocrData: JSON.stringify(mockOcrData),
      ocrConfidence: 0.97,
      fraudScore: 0.02,
    },
  });

  logger.info(`OCR completed for document ${docId}`);
}

// Get OCR results
export const getOCRResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await prisma.document.findUnique({
    where: { id: req.params.id, userId: req.user!.userId },
    select: { id: true, ocrStatus: true, ocrData: true, ocrConfidence: true, fraudScore: true },
  });
  if (!doc) { sendNotFound(res, 'Document not found'); return; }

  const parsedDoc = {
    ...doc,
    ocrData: doc.ocrData ? JSON.parse(doc.ocrData as string) : null
  };

  sendSuccess(res, parsedDoc);
};

// Submit to blockchain
export const hashToBlockchain = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user!.userId, isDeleted: false },
  });
  if (!doc) { sendNotFound(res, 'Document not found'); return; }
  if (!doc.documentHash) { sendError(res, 'Document hash not computed yet'); return; }
  if (doc.blockchainStatus === 'VERIFIED') { sendError(res, 'Document already verified on blockchain'); return; }

  await prisma.document.update({ where: { id: doc.id }, data: { blockchainStatus: BlockchainStatus.PENDING_TX } });

  // In production: call blockchain service
  submitToPolygon(doc.id, doc.documentHash, req.user!.userId).catch((e) =>
    logger.error('Blockchain submission failed:', e)
  );

  sendSuccess(res, { status: 'PENDING_TX', message: 'Submitted to Polygon blockchain. Verification pending.' });
};

// Simulated blockchain submission
async function submitToPolygon(docId: string, hash: string, userId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 4000));

  const mockTxHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const mockBlockNumber = BigInt(14859201 + Math.floor(Math.random() * 1000));

  await prisma.document.update({
    where: { id: docId },
    data: {
      blockchainStatus: BlockchainStatus.VERIFIED,
      txHash: mockTxHash,
      blockNumber: mockBlockNumber,
      verifiedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      title: 'Document Blockchain Verified',
      body: 'Your document has been verified and stored on Polygon blockchain.',
      type: 'DOCUMENT_VERIFIED',
      data: JSON.stringify({ docId, txHash: mockTxHash }),
    },
  });

  logger.info(`Blockchain verified: doc ${docId}, tx ${mockTxHash}`);
}

// Get blockchain details
export const getBlockchainDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    select: {
      id: true, title: true, documentHash: true, txHash: true,
      blockNumber: true, blockchainStatus: true, verifiedAt: true,
      issuedBy: true,
    },
  });
  if (!doc) { sendNotFound(res, 'Document not found'); return; }

  sendSuccess(res, {
    ...doc,
    network: 'Polygon (MATIC)',
    chainId: 137,
    explorer: doc.txHash ? `https://polygonscan.com/tx/${doc.txHash}` : null,
    consensus: 'Proof of Stake',
    confirmations: 128,
  });
};

// Delete document
export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await prisma.document.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!doc) { sendNotFound(res, 'Document not found'); return; }

  await prisma.document.update({ where: { id: doc.id }, data: { isDeleted: true, status: DocumentStatus.ARCHIVED } });
  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'DOCUMENT_DELETED', entity: 'Document', entityId: doc.id },
  });

  sendSuccess(res, null, 'Document deleted');
};

// Serve file (with auth check)
export const downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user!.userId, isDeleted: false },
  });
  if (!doc) { sendNotFound(res, 'Document not found'); return; }

  if (!fs.existsSync(doc.fileUrl)) {
    sendNotFound(res, 'File not found on storage');
    return;
  }

  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
  res.sendFile(path.resolve(doc.fileUrl));
};
