import axios from 'axios';

// Axios instance configured for HttpOnly cookie authentication
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Request interceptor – attach Bearer auth token from the AuthContext storage key
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('orthodoxconnect_auth');
      if (stored) {
        const identity = JSON.parse(stored);
        if (identity?.token) {
          config.headers.Authorization = `Bearer ${identity.token}`;
        }
      }
    } catch {
      // malformed storage — ignore, request will get a 401
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
