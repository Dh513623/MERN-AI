import API from './api';

export const generateSpeakingTopic = () =>
  API.post('/speaking', { mode: 'generate' }, {
    headers: { 'Content-Type': 'application/json' },
  });

export const evaluateSpeaking = (data) =>
  API.post('/speaking', data, {
    headers: { 'Content-Type': 'application/json' },
  });
