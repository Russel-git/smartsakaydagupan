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
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/")
    ) {
      localStorage.removeItem("smartsakay_admin_token");
      localStorage.removeItem("smartsakay_admin_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default api;
