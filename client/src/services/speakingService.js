import API from './api';

export const generateSpeakingTopic = () =>
  API.post('/speaking', { mode: 'generate' }, {
    headers: { 'Content-Type': 'application/json' },
  });

export const evaluateSpeaking = (formData) =>
  API.post('/speaking', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
