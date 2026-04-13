import API from './api';

export const getPronunciationSentences = (userId) =>
  API.get(`/pronunciation/sentences/${userId}`);
export const analyzePronunciation = (formData) =>
  API.post('/pronunciation/analyze', formData);
