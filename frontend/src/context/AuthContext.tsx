import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client';

interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  isKYCVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, code: string) => Promise<void>;
  verifyPin: (phone: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  sendOTP: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredToken();
  }, []);

  const loadStoredToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await apiClient.get('/auth/me');
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load token:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phone: string) => {
    await apiClient.post('/auth/send-otp', { phone, type: 'LOGIN' });
  };

  const login = async (phone: string, code: string) => {
    const response = await apiClient.post('/auth/verify-otp', { phone, code });
    const { accessToken, refreshToken, user } = response.data.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setUser(user);
  };

  const verifyPin = async (phone: string, pin: string) => {
    const response = await apiClient.post('/auth/verify-pin', { phone, pin });
    const { accessToken, refreshToken, user } = response.data.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    setUser(user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        verifyPin,
        logout,
        sendOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
