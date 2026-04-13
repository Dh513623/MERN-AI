import API from './api';

export const getProgressReport = (userId) =>
  API.get(`/progress/report/${userId}`);

export const downloadReport = (userId) =>
  API.get(`/progress/report/download/${userId}`, { responseType: 'blob' });
