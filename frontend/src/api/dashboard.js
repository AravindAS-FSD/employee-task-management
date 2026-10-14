import { api } from './client.js';

export const dashboardApi = {
  get: async () => (await api.get('/dashboard')).data,
};
