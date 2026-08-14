import axios from 'axios';

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Attach the JWT (if present) to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to /login when the token is missing/expired/invalid (per spec:
// "Redirect to login when token is expired or invalid").
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message as string;
    if (data && typeof data === 'object') {
      const firstFieldError = Object.values(data)[0];
      if (typeof firstFieldError === 'string') return firstFieldError;
    }
    if (error.message) return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default axiosClient;
