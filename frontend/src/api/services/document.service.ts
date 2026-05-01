import apiClient from '../client';

export interface Document {
  id: string;
  title: string;
  subtitle: string;
  added: string;
  status: 'verified' | 'pending' | 'action';
  statusLabel: string;
  icon: string;
  iconColor: string;
  accentColor: string;
  url?: string;
}

export const getDocuments = async (): Promise<Document[]> => {
  const response = await apiClient.get('/documents');
  return response.data.documents;
};

export const uploadDocument = async (formData: FormData): Promise<Document> => {
  const response = await apiClient.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.document;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await apiClient.delete(`/documents/${id}`);
};
