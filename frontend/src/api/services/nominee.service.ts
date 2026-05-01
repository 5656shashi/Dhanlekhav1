import apiClient from '../client';

export interface Nominee {
  id: string;
  name: string;
  relation: string;
  phone: string;
  access: string;
  allocation: string;
  verified: boolean;
}

export const getNominees = async (): Promise<Nominee[]> => {
  const response = await apiClient.get('/nominees');
  return response.data.nominees;
};

export const addNominee = async (nominee: Partial<Nominee>): Promise<Nominee> => {
  const response = await apiClient.post('/nominees', nominee);
  return response.data.nominee;
};

export const removeNominee = async (id: string): Promise<void> => {
  await apiClient.delete(`/nominees/${id}`);
};
