import API from './api';

export const getTodayPlan = () => API.get('/adaptive/today-plan');
