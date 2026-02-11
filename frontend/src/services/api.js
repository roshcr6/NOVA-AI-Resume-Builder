import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const sessionId = localStorage.getItem('nova_session_id');
    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
    
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded');
    }
    
    if (error.response?.status === 500) {
      console.error('Server error:', errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export const resumeService = {
  generate: (data) => api.post('/resume/generate', data),
  edit: (resumeId, instruction) => api.post(`/resume/${resumeId}/edit`, { instruction }),
  updateDirect: (resumeId, structuredData) => api.put(`/resume/${resumeId}/update`, { structuredData }),
  getCurrent: () => api.get('/resume/current'),
  getById: (resumeId) => api.get(`/resume/${resumeId}`),
  getHistory: () => api.get('/resume/history'),
  activate: (resumeId) => api.put(`/resume/${resumeId}/activate`),
  delete: (resumeId) => api.delete(`/resume/${resumeId}`),
  regeneratePdf: (resumeId) => api.post(`/resume/${resumeId}/regenerate-pdf`)
};

export const analysisService = {
  analyze: (formData) => api.post('/analysis/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  fix: (data) => api.post('/analysis/fix', data),
  getHistory: () => api.get('/analysis/history'),
  getById: (analysisId) => api.get(`/analysis/${analysisId}`),
  delete: (analysisId) => api.delete(`/analysis/${analysisId}`)
};

export const jobService = {
  search: (params) => api.get('/jobs/search', { params }),
  apply: (data) => api.post('/jobs/apply', data),
  sendEmail: (data) => api.post('/jobs/send-email', data),
  getEmailPreview: (resumeId, params) => api.get(`/jobs/email-preview/${resumeId}`, { params })
};

export const sessionService = {
  getCurrent: () => api.get('/session/current'),
  getProfile: () => api.get('/session/profile'),
  deleteData: () => api.delete('/session/data')
};

export default api;
