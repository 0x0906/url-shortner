import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      return Promise.reject(
        new Error(
          'API URL configuration error: VITE_API_URL is missing in Vercel environment variables.'
        )
      );
    }
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.error || 'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(errorMessage));
  }
);
export default api;
