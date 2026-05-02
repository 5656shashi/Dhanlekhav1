import client, { apiCall } from '../utils/apiClient';

export const authApi = {
  sendOTP: (phone: string) => apiCall(client.post('/auth/send-otp', { phone, type: 'LOGIN' })),
  verifyOTP: (phone: string, code: string) =>
    apiCall<{ accessToken: string; refreshToken: string; isNewUser: boolean; user: any }>(
      client.post('/auth/verify-otp', { phone, code })
    ),
  verifyPIN: (phone: string, pin: string) =>
    apiCall<{ accessToken: string; refreshToken: string }>(client.post('/auth/verify-pin', { phone, pin })),
  setPin: (pin: string, currentPin?: string) => apiCall(client.post('/auth/set-pin', { pin, currentPin })),
  refresh: (refreshToken: string) =>
    apiCall<{ accessToken: string; refreshToken: string }>(client.post('/auth/refresh', { refreshToken })),
  logout: (refreshToken: string) => apiCall(client.post('/auth/logout', { refreshToken })),
  getMe: () => apiCall<any>(client.get('/auth/me')),
  updateProfile: (data: { name?: string; email?: string }) => apiCall<any>(client.patch('/auth/me', data)),
};

export const dashboardApi = {
  get: () => apiCall<any>(client.get('/dashboard')),
};

export const documentsApi = {
  list: (params?: any) => apiCall<any[]>(client.get('/documents', { params })),
  get: (id: string) => apiCall<any>(client.get(`/documents/${id}`)),
  upload: (formData: FormData) =>
    apiCall<any>(client.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
      transformRequest: [() => formData],
    })),
  getOCR: (id: string) => apiCall<any>(client.get(`/documents/${id}/ocr`)),
  submitToBlockchain: (id: string) => apiCall<any>(client.post(`/documents/${id}/blockchain`)),
  getBlockchainDetails: (id: string) => apiCall<any>(client.get(`/documents/${id}/blockchain`)),
  delete: (id: string) => apiCall(client.delete(`/documents/${id}`)),
};

export const nomineesApi = {
  list: () => apiCall<{ nominees: any[]; totalAllocation: number }>(client.get('/nominees')),
  create: (data: any) => apiCall<any>(client.post('/nominees', data)),
  update: (id: string, data: any) => apiCall<any>(client.patch(`/nominees/${id}`, data)),
  revoke: (id: string) => apiCall(client.delete(`/nominees/${id}`)),
  listNGOs: () => apiCall<any[]>(client.get('/ngos')),
};

export const accountsApi = {
  list: () => apiCall<any[]>(client.get('/accounts')),
  connect: (data: any) => apiCall<any>(client.post('/accounts', data)),
  disconnect: (id: string) => apiCall(client.delete(`/accounts/${id}`)),
  sync: (id: string) => apiCall(client.post(`/accounts/${id}/sync`)),
};

export const reportsApi = {
  list: () => apiCall<any[]>(client.get('/reports')),
  create: (data: any) => apiCall<any>(client.post('/reports', data)),
  get: (id: string) => apiCall<any>(client.get(`/reports/${id}`)),
};

export const kycApi = {
  submit: (data: { aadhaar: string; pan: string; dob?: string }) => apiCall<any>(client.post('/kyc/submit', data)),
  getStatus: () => apiCall<any>(client.get('/kyc/status')),
};

export const securityApi = {
  getSettings: () => apiCall<any>(client.get('/security')),
  updateSettings: (data: { biometricEnabled?: boolean; deadManEnabled?: boolean; deadManDays?: number; twoFAEnabled?: boolean }) => apiCall<any>(client.patch('/security', data)),
  revokeAllSessions: () => apiCall(client.post('/security/revoke-sessions')),
  getShieldStatus: () => apiCall<{ active: boolean }>(client.get('/security/shield/status')),
  toggleShield: () => apiCall<{ active: boolean }>(client.post('/security/shield/toggle')),
  startSession: (data: { targetEndpoint: string; method: string; iterations?: number; categories?: string[] }) => 
    apiCall<{ sessionId: string; status: string }>(client.post('/fuzz/sessions', data)),
  listSessions: () => apiCall<any[]>(client.get('/fuzz/sessions')),
  getSession: (id: string) => apiCall<any>(client.get(`/fuzz/sessions/${id}`)),
  stopSession: (id: string) => apiCall<any>(client.post(`/fuzz/sessions/${id}/stop`)),
  getResults: (id: string, params?: any) => apiCall<any[]>(client.get(`/fuzz/sessions/${id}/results`, { params })),
  exportReport: (id: string) => `${client.defaults.baseURL}/fuzz/sessions/${id}/export`,
};

export const notificationsApi = {
  list: (params?: any) => apiCall<any[]>(client.get('/notifications', { params })),
  markRead: (id: string) => apiCall(client.patch(`/notifications/${id}/read`)),
  markAllRead: () => apiCall(client.patch('/notifications/read-all')),
};

export const paymentsApi = {
  createOrder: (purpose: 'DOCUMENT_UPLOAD' | 'API_INTEGRATION', metadata?: any) =>
    apiCall<{
      orderId: string; transactionId: string; amount: number;
      amountDisplay: string; currency: string; keyId: string;
      description: string; receipt: string;
    }>(client.post('/payments/create-order', { purpose, metadata })),

  verifyPayment: (data: {
    transactionId: string; razorpayOrderId: string;
    razorpayPaymentId: string; razorpaySignature: string;
    documentId?: string; documentTitle?: string; documentType?: string;
    provider?: string; providerName?: string; accountType?: string;
  }) => apiCall<any>(client.post('/payments/verify', data)),

  getHistory: () => apiCall<any[]>(client.get('/payments/history')),
  getTransaction: (id: string) => apiCall<any>(client.get(`/payments/${id}`)),
};
