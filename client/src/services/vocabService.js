import API from './api';

export const getDailyVocab = (userId) =>
  API.post(`/vocab/daily/${userId}`);

export const submitVocabTest = (data) =>
  API.post('/vocab/submit', data);
