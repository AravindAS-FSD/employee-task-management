import { api } from './client.js';

export const tasksApi = {
  list: (params) => api.get('/tasks', params), // returns { data, meta }
  get: async (id) => (await api.get(`/tasks/${id}`)).data,
  create: async (body) => (await api.post('/tasks', body)).data,
  update: async (id, body) => (await api.put(`/tasks/${id}`, body)).data,
  changeStatus: async (id, status) => (await api.put(`/tasks/${id}/status`, { status })).data,
  remove: (id) => api.del(`/tasks/${id}`),
};
