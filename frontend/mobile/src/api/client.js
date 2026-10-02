import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens, clearUser } from '../utils/storage';
import { API_BASE_URL } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 and refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry refresh-token or login endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
        await saveTokens(newAccess, newRefresh);

        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        await clearUser();
        // Navigation to login will be handled by AuthContext
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper to extract error message
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    if (error.response.data.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
      return `${error.response.data.message}: ${error.response.data.errors.join(', ')}`;
    }
    return error.response.data.message;
  }
  if (error.response?.data?.error) return error.response.data.error;
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return 'Unable to connect to server. Please check your connection or server status.';
  }
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  if (error.message && typeof error.message === 'string' && error.message !== 'Error') {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

export default apiClient;
