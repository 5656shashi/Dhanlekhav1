import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { storage } from './storage';

let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];

const flush = (err: any, token: string | null) => {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token!)));
  queue = [];
};

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  const token = await storage.getAccessToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  
  // Verbose logging
  console.log(`[API Request] ${cfg.method?.toUpperCase()} ${cfg.url}`, cfg.data || cfg.params || '');
  
  return cfg;
});

client.interceptors.response.use(
  r => {
    console.log(`[API Response] ${r.config.method?.toUpperCase()} ${r.config.url} — ${r.status}`);
    return r;
  },
  async err => {
    const status = err.response?.status;
    const data = err.response?.data;
    
    console.error(`[API Error] ${err.config?.method?.toUpperCase()} ${err.config?.url}`, {
      status,
      data,
      message: err.message
    });
    
    const orig = err.config;
    // 401 Unauthorized - Attempt token refresh
    if (status === 401 && !orig._retry) {
      if (isRefreshing) {
        console.log('[Auth] Already refreshing, queuing request...');
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(t => { 
            orig.headers.Authorization = `Bearer ${t}`; 
            return client(orig); 
          });
      }

      orig._retry = true;
      isRefreshing = true;
      console.log('[Auth] Attempting token refresh...');

      try {
        const rt = await storage.getRefreshToken();
        if (!rt) {
          console.warn('[Auth] No refresh token available in storage.');
          throw new Error('No refresh token');
        }

        // Use standard axios to avoid recursion
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: rt });
        console.log('[Auth] Refresh response:', res.status, res.data);

        // Expecting { success: true, data: { accessToken, refreshToken }, ... }
        const tokens = res.data?.data;
        if (!tokens?.accessToken) {
          throw new Error('Refresh response missing access token');
        }

        const { accessToken, refreshToken: newRt } = tokens;
        await storage.setTokens(accessToken, newRt || rt); // Keep old RT if new one not provided
        
        console.log('[Auth] Refresh success. Retrying original request...');
        flush(null, accessToken);
        orig.headers.Authorization = `Bearer ${accessToken}`;
        return client(orig);
      } catch (e: any) {
        console.error('[Auth] Refresh failed:', e.response?.data || e.message);
        flush(e, null);
        await storage.clearAll();
        // Optional: Trigger a logout event or redirect to login
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export const apiCall = async <T>(request: Promise<any>): Promise<T> => {
  try {
    const res = await request;
    return res.data.data as T;
  } catch (e: any) {
    const msg = e.response?.data?.message || e.response?.data?.errors?.[0]?.message || e.message || 'Something went wrong';
    throw new Error(msg);
  }
};

export default client;
