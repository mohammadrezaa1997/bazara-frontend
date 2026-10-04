import axios from 'axios';
import { reportClientEvent } from './client-logger';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers['X-Request-ID']) {
    config.headers['X-Request-ID'] =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error.response?.status as number | undefined;
    if (!statusCode || statusCode >= 500) {
      reportClientEvent({
        event: 'api_failure',
        message: error.message || 'API request failed',
        component: `${error.config?.method ?? 'unknown'} ${error.config?.url ?? 'unknown'}`,
        requestId: error.response?.headers?.['x-request-id'],
        statusCode,
      });
    }
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
