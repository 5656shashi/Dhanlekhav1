import apiClient from '../client';

export interface DashboardData {
  totalNetWorth: string;
  growth: string;
  isVerified: boolean;
  assets: {
    id: string;
    label: string;
    value: string;
    percent: string;
    icon: string;
    color: string;
  }[];
  recentActivity: {
    id: string;
    title: string;
    desc: string;
    time: string;
    active: boolean;
  }[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await apiClient.get('/dashboard');
  return response.data;
};
