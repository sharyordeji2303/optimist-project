import axios from 'axios';

// Vite proxies /api locally; Vercel supplies the backend URL at build time.
const serverUrl = (import.meta.env?.VITE_API_URL || '').trim().replace(/\/+$/, '');

export const axiosInstance = axios.create({
  baseURL: `${serverUrl}/api`,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

export const getErrorMessage = (error) => {
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error.isAxiosError && !error.response) return 'Cannot reach the server. Check that the API is running.';
  return error.message || 'Something went wrong. Please try again.';
};
