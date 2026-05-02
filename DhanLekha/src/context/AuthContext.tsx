import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { authApi } from '../services/api';

export interface AuthUser {
  id: string; phone: string; name: string | null; email: string | null;
  kycStatus: string; plan: string;
  _count?: { documents: number; nominees: number; connectedAccounts: number };
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (at: string, rt: string, u: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, isAuthenticated: false, isLoading: true,
  login: async () => {}, logout: async () => {}, refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, cached] = await Promise.all([storage.getAccessToken(), storage.getUser()]);
        if (token && cached) {
          setUser(cached);
          authApi.getMe().then(u => { setUser(u); storage.setUser(u); }).catch(() => {});
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (at: string, rt: string, u: AuthUser) => {
    await storage.setTokens(at, rt);
    await storage.setUser(u);
    setUser(u);
  };

  const logout = async () => {
    try { const rt = await storage.getRefreshToken(); if (rt) await authApi.logout(rt); } catch {}
    await storage.clearAll();
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await authApi.getMe();
    setUser(u); await storage.setUser(u);
  };

  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
