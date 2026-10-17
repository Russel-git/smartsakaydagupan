import axios from "axios";

const getAdminBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "https://smartsakay-backend.onrender.com/api";
    }
  }
  return "/api";
};

const api = axios.create({
  baseURL: getAdminBaseUrl(),
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartsakay_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isSuspendedOrDeactivated =
      error.response?.status === 403 &&
      (error.response?.data?.message?.toLowerCase().includes('deactivated') ||
       error.response?.data?.message?.toLowerCase().includes('suspended') ||
       error.response?.data?.error === 'ACCOUNT_SUSPENDED');

    const publicPaths = ['/', '/about', '/blog', '/faqs', '/contact', '/login'];
    const isPublicPage = publicPaths.includes(window.location.pathname);

    if (
      (error.response?.status === 401 || isSuspendedOrDeactivated) &&
      !isPublicPage
    ) {
      localStorage.removeItem('smartsakay_admin_token');
      localStorage.removeItem('smartsakay_admin_user');
      window.location.href = isSuspendedOrDeactivated ? '/login?suspended=true' : '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
