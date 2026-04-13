import API from './api';

export const getDailyGrammarTest = (userId) =>
  API.get(`/grammar/daily-test?userId=${userId}`);

export const submitGrammarTest = (data) =>
  API.post('/grammar/daily-submit', data);
