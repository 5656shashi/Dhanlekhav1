import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { logger } from '../utils/logger';
import { getShieldState, setShieldState } from '../config/security';

export const toggleShield = async (req: AuthRequest, res: Response) => {
  const currentState = getShieldState();
  const newState = !currentState;
  setShieldState(newState);
  
  logger.info(`🛡️  MASTER SHIELD TOGGLED: ${newState ? 'ON' : 'OFF'}`);
  sendSuccess(res, { active: newState }, `Security Shield ${newState ? 'Activated' : 'Deactivated'}`);
};

export const getShieldStatus = async (req: AuthRequest, res: Response) => {
  sendSuccess(res, { active: getShieldState() });
};

export const getGlobalShieldState = () => getShieldState();
