import api from '../client';

export interface FuzzResult {
  id: string;
  timestamp: string;
  target: string;
  input: any;
  status: number;
  response: any;
  isFailure: boolean;
  errorStack?: string;
}

export interface FuzzStatus {
  isRunning: boolean;
  count: number;
}

export const startFuzzing = async () => {
  const { data } = await api.post('/fuzzer/start');
  return data;
};

export const stopFuzzing = async () => {
  const { data } = await api.post('/fuzzer/stop');
  return data;
};

export const getFuzzResults = async (): Promise<FuzzResult[]> => {
  const { data } = await api.get('/fuzzer/results');
  return data;
};

export const getFuzzStatus = async (): Promise<FuzzStatus> => {
  const { data } = await api.get('/fuzzer/status');
  return data;
};
