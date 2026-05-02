import { logger } from '../utils/logger';

// Global Security Shield State
// Initialized to TRUE for a "Secure by Default" posture
let isShieldActive = true;

export const setShieldState = (active: boolean) => {
  isShieldActive = active;
  logger.info(`🛡️  SHIELD STATE UPDATED: ${isShieldActive ? 'ACTIVE' : 'INACTIVE'}`);
};

export const getShieldState = () => isShieldActive;
