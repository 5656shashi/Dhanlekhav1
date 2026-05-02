import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { runFuzzSession } from '../services/fuzz.engine';
import { signAccessToken } from '../utils/jwt';

export const startSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const { targetEndpoint, method, iterations = 100, categories = [], shieldEnabled = false } = req.body;
  if (!targetEndpoint || !method) {
    sendError(res, 'Target endpoint and method are required');
    return;
  }

  const userId = req.user!.userId;
  const session = await prisma.fuzzSession.create({
    data: {
      userId,
      targetEndpoint,
      method: method.toUpperCase(),
      iterations: Math.min(iterations, 500),
      status: 'RUNNING',
      config: { categories, shieldEnabled },
    }
  });

  // Generate a fresh token for the background task to use
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const token = signAccessToken({ userId: user!.id, phone: user!.phone, plan: user!.plan });

  // Start engine async
  runFuzzSession(session.id, targetEndpoint, method, { iterations, categories, shieldEnabled }, token)
    .catch(err => console.error(`[FuzzSession ${session.id}] Error:`, err));

  sendSuccess(res, { sessionId: session.id, status: 'RUNNING' }, 'Fuzzing session started');
};

export const stopSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.fuzzSession.findFirst({
    where: { id: req.params.id, userId: req.user!.userId }
  });
  if (!session) { sendNotFound(res, 'Session not found'); return; }

  const updated = await prisma.fuzzSession.update({
    where: { id: session.id },
    data: { status: 'STOPPED' }
  });

  sendSuccess(res, updated, 'Fuzzing session stopped');
};

export const getSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.fuzzSession.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: {
      results: {
        take: 50,
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!session) { sendNotFound(res, 'Session not found'); return; }

  const totalRequests = await prisma.fuzzResult.count({ where: { sessionId: session.id } });
  
  sendSuccess(res, { ...session, totalRequests });
};

export const listSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  const sessions = await prisma.fuzzSession.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, targetEndpoint: true, method: true, status: true,
      iterations: true, currentIteration: true, crashes: true,
      anomalies: true, createdAt: true
    }
  });
  sendSuccess(res, sessions);
};

export const getResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', severity, category } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { sessionId: req.params.id };
  if (severity) where.severity = severity as string;
  if (category) where.category = category as string;

  const [results, total] = await Promise.all([
    prisma.fuzzResult.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.fuzzResult.count({ where })
  ]);

  sendSuccess(res, results, 'Results fetched', 200, {
    total,
    page: parseInt(page as string),
    limit: parseInt(limit as string)
  });
};

export const exportReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await prisma.fuzzSession.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: { results: { orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }] } }
  });
  if (!session) { sendNotFound(res, 'Session not found'); return; }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="fuzz-report-${session.id}.json"`);
  res.send(JSON.stringify(session, null, 2));
};
