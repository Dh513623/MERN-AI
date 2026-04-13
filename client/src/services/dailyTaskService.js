import API from './api';

export const getDailyTasks = () => API.get('/daily-tasks');

export const completeTask = (taskId) =>
  API.post(`/daily-tasks/complete/${taskId}`);
