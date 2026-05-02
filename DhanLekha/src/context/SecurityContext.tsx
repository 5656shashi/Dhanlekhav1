import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { securityApi } from '../services/api';
import { Alert } from 'react-native';

interface SecurityCtx {
  shieldActive: boolean;
  toggleShield: () => Promise<void>;
  refreshShieldStatus: () => Promise<void>;
}

const Ctx = createContext<SecurityCtx>({
  shieldActive: true,
  toggleShield: async () => {},
  refreshShieldStatus: async () => {},
});

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  const [shieldActive, setShieldActive] = useState(true);

  const refreshShieldStatus = async () => {
    try {
      const res = await securityApi.getShieldStatus();
      setShieldActive(res.active);
    } catch (e) {
      console.warn('Could not fetch shield status');
    }
  };

  useEffect(() => {
    refreshShieldStatus();
  }, []);

  const toggleShield = async () => {
    try {
      const res = await securityApi.toggleShield();
      setShieldActive(res.active);
      return res.active;
    } catch (e) {
      Alert.alert('Error', 'Could not toggle security shield');
      throw e;
    }
  };

  return (
    <Ctx.Provider value={{ shieldActive, toggleShield, refreshShieldStatus }}>
      {children}
    </Ctx.Provider>
  );
};

export const useSecurity = () => useContext(Ctx);
