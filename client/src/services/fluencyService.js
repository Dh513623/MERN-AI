import API from './api';

export const generateFluencyExercise = () =>
  API.post('/fluency', { mode: 'generate' });

export const evaluateFluency = (userAnswer) =>
  API.post('/fluency', { mode: 'evaluate', userAnswer });
