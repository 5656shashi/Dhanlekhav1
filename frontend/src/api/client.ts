import axios from 'axios';
import { Platform } from 'react-native';

// In development, replace with your machine's IP for physical device testing
const BASE_URL = Platform.select({
  ios: 'http://192.168.1.75:3000/api/v1',
  android: 'http://192.168.1.75:3000/api/v1',
  default: 'http://192.168.1.75:3000/api/v1',
});

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Auth
apiClient.interceptors.request.use(
  async (config) => {
    // Token handling logic will go here
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Refresh token logic will go here
    }
    return Promise.reject(error);
  }
);

export default apiClient;
