import { api } from './client.js';

const unwrap = (p) => p.then((r) => r.data.data);

export const authApi = {
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  refresh: () => unwrap(api.post('/auth/refresh')),
  logout: () => api.post('/auth/logout'),
  me: () => unwrap(api.get('/auth/me')),
  changePassword: (payload) => api.post('/auth/change-password', payload),
};

export const dashboardApi = {
  admin: () => unwrap(api.get('/dashboard/admin')),
  supervisor: () => unwrap(api.get('/dashboard/supervisor')),
};

export const violationApi = {
  list: (params) => unwrap(api.get('/violations', { params })),
  get: (id) => unwrap(api.get(`/violations/${id}`)),
  acknowledge: (id, note) => api.post(`/violations/${id}/acknowledge`, { note }),
  bulkAcknowledge: (ids, note) => api.post('/violations/bulk-acknowledge', { ids, note }),
  resolve: (id, note) => api.post(`/violations/${id}/resolve`, { note }),
  ingest: (payload) => api.post('/violations/ingest', payload),
};

export const alertApi = {
  list: (params) => unwrap(api.get('/alerts', { params })),
  responders: (id) => unwrap(api.get(`/alerts/${id}/responders`)),
};

export const userApi = {
  list: (params) => unwrap(api.get('/users', { params })),
  create: (payload) => unwrap(api.post('/users', payload)),
  update: (id, payload) => unwrap(api.patch(`/users/${id}`, payload)),
  resetPassword: (id, password) => api.post(`/users/${id}/reset-password`, { password }),
};

export const workerApi = {
  list: (params) => unwrap(api.get('/workers', { params })),
  get: (id) => unwrap(api.get(`/workers/${id}`)),
  filters: () => unwrap(api.get('/workers/filters')),
};

export const siteApi = { list: () => unwrap(api.get('/sites')) };
export const insightApi = { get: (params) => unwrap(api.get('/insights', { params })) };

export const reportApi = {
  preview: (params) => unwrap(api.get('/reports/violations/preview', { params })),
  downloadCSV: async (params) => {
    const res = await api.get('/reports/violations.csv', { params, responseType: 'blob' });
    const disposition = res.headers['content-disposition'] || '';
    const name = disposition.match(/filename="(.+?)"/)?.[1] || 'ppe-violations.csv';
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    return Number(res.headers['x-row-count'] || 0);
  },
};
