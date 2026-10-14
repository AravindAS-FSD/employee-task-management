import { api } from './client.js';

export const employeesApi = {
  list: (params) => api.get('/employees', params), // returns { data, meta }
  get: async (id) => (await api.get(`/employees/${id}`)).data,
  create: async (body) => (await api.post('/employees', body)).data,
  update: async (id, body) => (await api.put(`/employees/${id}`, body)).data,
  remove: (id) => api.del(`/employees/${id}`),
};
