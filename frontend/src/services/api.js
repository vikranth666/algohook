
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY,
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Webhooks API
export const webhooksAPI = {
  getAll: (params = {}) => 
    api.get('/api/webhooks', { params }),
  
  getById: (id) => 
    api.get(`/api/webhooks/${id}`),
  
  create: (data) => 
    api.post('/api/webhooks', data),
  
  update: (id, data) => 
    api.put(`/api/webhooks/${id}`, data),
  
  delete: (id) => 
    api.delete(`/api/webhooks/${id}`),
  
  toggle: (id, isActive) => 
    api.post(`/api/webhooks/${id}/toggle`, { isActive }),
  
  getDeliveries: (id, params = {}) => 
    api.get(`/api/webhooks/${id}/deliveries`, { params }),
  
  getStats: (id) => 
    api.get(`/api/webhooks/${id}/stats`),
  
  retry: (webhookId, eventId) => 
    api.post(`/api/webhooks/${webhookId}/retry/${eventId}`),
};

// Events API
export const eventsAPI = {
  getAll: (params = {}) => 
    api.get('/api/events', { 
      params,
      headers: { 'X-Service-Token': API_KEY }
    }),
  
  getById: (id) => 
    api.get(`/api/events/${id}`, {
      headers: { 'X-Service-Token': API_KEY }
    }),
  
  create: (data) => 
    api.post('/api/events', data, {
      headers: { 'X-Service-Token': API_KEY }
    }),
  
  getStats: () => 
    api.get('/api/events/analytics/stats', {
      headers: { 'X-Service-Token': API_KEY }
    }),
};

// Dashboard API
export const dashboardAPI = {
  getOverview: () => 
    api.get('/api/dashboard/overview'),
  
  getRecentDeliveries: (limit = 100) => 
    api.get('/api/dashboard/recent-deliveries', { params: { limit } }),
  
  getHealth: () => 
    api.get('/api/dashboard/health'),
  
  getMetrics: () => 
    api.get('/api/dashboard/metrics'),
};

export default api;