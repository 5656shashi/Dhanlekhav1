import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response';
import { NomineeType, AccessType } from '@prisma/client';

export const listNominees = async (req: AuthRequest, res: Response): Promise<void> => {
  const nominees = await prisma.nominee.findMany({
    where: { userId: req.user!.userId, isActive: true },
    include: { documentAccess: { include: { document: { select: { id: true, title: true, docType: true } } } } },
    orderBy: { createdAt: 'asc' },
  });

  const total = nominees.reduce((s, n) => s + n.allocationPct, 0);

  sendSuccess(res, { nominees, totalAllocation: total });
};

export const createNominee = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, relation, phone, email, nomineeType = 'INDIVIDUAL', ngoName, ngoRegNo, accessType = 'READ_ONLY', allocationPct = 0, conditions } = req.body;

  if (!name) { sendError(res, 'Name is required'); return; }

  // Validate total allocation won't exceed 100% (ONLY IF SHIELD IS ON)
  const { getShieldState } = require('../config/security');
  const isShieldOn = getShieldState();

  if (isShieldOn) {
    const existing = await prisma.nominee.aggregate({
      where: { userId: req.user!.userId, isActive: true },
      _sum: { allocationPct: true },
    });
    const currentTotal = existing._sum.allocationPct ?? 0;
    if (currentTotal + allocationPct > 100) {
      sendError(res, `Total allocation would exceed 100%. Available: ${100 - currentTotal}%`);
      return;
    }
  } else {
    // Demo: If shield is OFF, allow the "mess up"
    if (allocationPct > 100) {
      console.log(`\x1b[31m💥 SECURITY BYPASS: Allowed illegal allocation of ${allocationPct}% for ${name}\x1b[0m`);
    }
  }

  const nominee = await prisma.nominee.create({
    data: {
      userId: req.user!.userId,
      name,
      relation: relation || 'Other',
      phone,
      email,
      nomineeType: nomineeType as NomineeType,
      ngoName,
      ngoRegNo,
      accessType: accessType as AccessType,
      allocationPct,
      conditions,
    },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'NOMINEE_ADDED', entity: 'Nominee', entityId: nominee.id },
  });

  await prisma.notification.create({
    data: {
      userId: req.user!.userId,
      title: 'Nominee Added',
      body: `${name} has been added as a nominee with ${allocationPct}% allocation.`,
      type: 'NOMINEE_ADDED',
      data: { nomineeId: nominee.id },
    },
  });

  sendCreated(res, nominee, 'Nominee added successfully');
};

export const updateNominee = async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.nominee.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!existing) { sendNotFound(res, 'Nominee not found'); return; }

  const { name, relation, phone, email, accessType, allocationPct, conditions } = req.body;

  if (allocationPct !== undefined) {
    const { getShieldState } = require('../config/security');
    if (getShieldState()) {
      const others = await prisma.nominee.aggregate({
        where: { userId: req.user!.userId, isActive: true, id: { not: existing.id } },
        _sum: { allocationPct: true },
      });
      const otherTotal = others._sum.allocationPct ?? 0;
      if (otherTotal + allocationPct > 100) {
        sendError(res, `Total allocation would exceed 100%. Available: ${100 - otherTotal}%`);
        return;
      }
    } else {
      if (allocationPct > 100) {
        console.log(`\x1b[31m💥 SECURITY BYPASS: Allowed illegal allocation update of ${allocationPct}% for ${existing.name}\x1b[0m`);
      }
    }
  }

  const nominee = await prisma.nominee.update({
    where: { id: existing.id },
    data: {
      ...(name && { name }),
      ...(relation && { relation }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(accessType && { accessType: accessType as AccessType }),
      ...(allocationPct !== undefined && { allocationPct }),
      ...(conditions && { conditions }),
    },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'NOMINEE_UPDATED', entity: 'Nominee', entityId: nominee.id },
  });

  sendSuccess(res, nominee, 'Nominee updated');
};

export const revokeNominee = async (req: AuthRequest, res: Response): Promise<void> => {
  const nominee = await prisma.nominee.findFirst({ where: { id: req.params.id, userId: req.user!.userId } });
  if (!nominee) { sendNotFound(res, 'Nominee not found'); return; }

  await prisma.nominee.update({ where: { id: nominee.id }, data: { isActive: false } });
  await prisma.nomineeDocumentAccess.updateMany({
    where: { nomineeId: nominee.id },
    data: { revokedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: 'NOMINEE_REVOKED', entity: 'Nominee', entityId: nominee.id, metadata: { name: nominee.name } },
  });

  sendSuccess(res, null, 'Nominee revoked. Smart contract update queued.');
};

// Grant document access to nominee
export const grantDocumentAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  const { nomineeId, documentId } = req.params;

  const [nominee, document] = await Promise.all([
    prisma.nominee.findFirst({ where: { id: nomineeId, userId: req.user!.userId } }),
    prisma.document.findFirst({ where: { id: documentId, userId: req.user!.userId } }),
  ]);

  if (!nominee) { sendNotFound(res, 'Nominee not found'); return; }
  if (!document) { sendNotFound(res, 'Document not found'); return; }

  const access = await prisma.nomineeDocumentAccess.upsert({
    where: { nomineeId_documentId: { nomineeId, documentId } },
    update: { revokedAt: null },
    create: { nomineeId, documentId },
  });

  sendSuccess(res, access, 'Document access granted');
};

// List NGOs
export const listNGOs = async (req: AuthRequest, res: Response): Promise<void> => {
  const ngos = [
    { id: 'ngo-1', name: 'GiveIndia', cause: 'Multi-cause', regNo: 'NGO/MH/2001/12345', rating: 4.9, trusted: true },
    { id: 'ngo-2', name: 'CRY India', cause: "Children's Rights", regNo: 'NGO/DL/1979/00001', rating: 4.8, trusted: true },
    { id: 'ngo-3', name: 'Goonj', cause: 'Rural Development', regNo: 'NGO/DL/1999/04521', rating: 4.7, trusted: true },
    { id: 'ngo-4', name: 'HelpAge India', cause: 'Elder Care', regNo: 'NGO/MH/1978/00018', rating: 4.8, trusted: true },
    { id: 'ngo-5', name: 'Teach For India', cause: 'Education', regNo: 'NGO/MH/2009/07890', rating: 4.9, trusted: true },
  ];
  sendSuccess(res, ngos, 'NGO list');
};
