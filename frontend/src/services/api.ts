import axios from 'axios';
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage = error.response?.data?.error || 'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(errorMessage));
  }
);
export default api;
